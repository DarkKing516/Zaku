import { CallHandler, ExecutionContext, Inject, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { Observable, catchError, from, mergeMap, of, throwError } from 'rxjs';
import { isUuid } from '@common/utils/uuid';
import { AppConfig } from '../config/app-config';
import { RequestContext } from '../request-context/request-context';
import {
  IDEMPOTENCY_KEY_HEADER,
  IDEMPOTENCY_LOCK_TTL_MS,
  IDEMPOTENCY_RETENTION_MS,
  IDEMPOTENT_REPLAYED_HEADER,
  IDEMPOTENT_ROUTE_OPTIONS,
} from './idempotency.constants';
import {
  IdempotencyKeyInvalidError,
  IdempotencyKeyRequiredError,
  IdempotencyKeyReusedError,
  IdempotencyRequestInProgressError,
} from './idempotency.errors';
import { IDEMPOTENCY_STORE, IdempotencyStorePort } from './idempotency-store.port';
import { deriveFingerprintKey, idempotencyStorageKey, requestFingerprint } from './request-fingerprint';

export interface IdempotentRouteOptions {
  readonly required: boolean;
  readonly lockTtlMs: number;
}

const IDEMPOTENCY_KEY_PATTERN = /^[\x21-\x7E]{8,255}$/;

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);
  private readonly fingerprintKey: Buffer;

  constructor(
    private readonly reflector: Reflector,
    @Inject(IDEMPOTENCY_STORE) private readonly store: IdempotencyStorePort,
    config: AppConfig,
  ) {
    this.fingerprintKey = deriveFingerprintKey(config.accessToken.secret);
  }

  async intercept(context: ExecutionContext, next: CallHandler<unknown>): Promise<Observable<unknown>> {
    const options = this.reflector.get<IdempotentRouteOptions | undefined>(IDEMPOTENT_ROUTE_OPTIONS, context.getHandler());
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const idempotencyKey = request.header(IDEMPOTENCY_KEY_HEADER);

    if (idempotencyKey === undefined) {
      if (options?.required) {
        throw new IdempotencyKeyRequiredError();
      }
      return next.handle();
    }
    if (!IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
      throw new IdempotencyKeyInvalidError();
    }

    const requestContext = RequestContext.current();
    const storageKey = idempotencyStorageKey({
      tenantId: requestContext?.tenantId ?? requestContext?.principal?.tenantId,
      subjectId: requestContext?.principal?.subjectId,
      method: request.method,
      route: routePatternOf(request),
      idempotencyKey,
    });
    const fingerprint = requestFingerprint(normalizeUuidParams(request.params), request.body, this.fingerprintKey);
    const reservation = await this.store.reserve(storageKey, fingerprint, options?.lockTtlMs ?? IDEMPOTENCY_LOCK_TTL_MS);

    switch (reservation.outcome) {
      case 'completed':
        response.status(reservation.response.statusCode);
        response.setHeader(IDEMPOTENT_REPLAYED_HEADER, 'true');
        return of(reservation.response.body);
      case 'in-progress':
        throw new IdempotencyRequestInProgressError();
      case 'fingerprint-mismatch':
        throw new IdempotencyKeyReusedError();
      case 'acquired':
        return next.handle().pipe(
          mergeMap((body) => from(this.remember(storageKey, fingerprint, response.statusCode, body))),
          catchError((error: unknown) =>
            from(this.store.release(storageKey).catch(() => undefined)).pipe(mergeMap(() => throwError(() => error))),
          ),
        );
    }
  }

  private async remember(storageKey: string, fingerprint: string, statusCode: number, body: unknown): Promise<unknown> {
    try {
      await this.store.complete(storageKey, fingerprint, { statusCode, body }, IDEMPOTENCY_RETENTION_MS);
    } catch (error) {
      this.logger.warn(`Could not persist idempotent response: ${error instanceof Error ? error.message : String(error)}`);
    }
    return body;
  }
}

function normalizeUuidParams(params: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(params).map(([name, value]) => [name, isUuid(value) ? value.toLowerCase() : value]),
  );
}

function routePatternOf(request: Request): string {
  const route: unknown = request.route;
  if (typeof route === 'object' && route !== null && 'path' in route && typeof route.path === 'string') {
    return route.path;
  }
  return request.path;
}
