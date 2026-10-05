import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { RequestContext } from './request-context';

export const REQUEST_ID_HEADER = 'x-request-id';
const CLIENT_REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{1,128}$/;
const HEALTH_PATH = '/health';

export function resolveRequestId(clientRequestId: string | undefined): string {
  return clientRequestId && CLIENT_REQUEST_ID_PATTERN.test(clientRequestId) ? clientRequestId : randomUUID();
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const requestId = resolveRequestId(request.header(REQUEST_ID_HEADER));
    response.setHeader(REQUEST_ID_HEADER, requestId);
    if (request.path !== HEALTH_PATH) {
      this.logger.log(`[${requestId}] ${request.method} ${request.originalUrl}`);
    }
    RequestContext.run({ requestId }, () => next());
  }
}
