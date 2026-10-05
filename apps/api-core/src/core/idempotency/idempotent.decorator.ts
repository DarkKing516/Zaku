import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';
import { IDEMPOTENCY_KEY_HEADER, IDEMPOTENCY_LOCK_TTL_MS, IDEMPOTENT_ROUTE_OPTIONS } from './idempotency.constants';
import { IdempotencyInterceptor, IdempotentRouteOptions } from './idempotency.interceptor';

export function Idempotent(options: Partial<IdempotentRouteOptions> = {}): MethodDecorator {
  const routeOptions: IdempotentRouteOptions = {
    required: options.required ?? false,
    lockTtlMs: options.lockTtlMs ?? IDEMPOTENCY_LOCK_TTL_MS,
  };
  return applyDecorators(
    SetMetadata(IDEMPOTENT_ROUTE_OPTIONS, routeOptions),
    UseInterceptors(IdempotencyInterceptor),
    ApiHeader({
      name: IDEMPOTENCY_KEY_HEADER,
      required: routeOptions.required,
      description: 'Client generated key (8-255 visible ASCII chars, a UUID is recommended). Retries with the same key and payload replay the first response for 24h.',
    }),
  );
}
