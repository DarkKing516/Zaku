import { Global, Module } from '@nestjs/common';
import { provideSwitchableAdapter } from '../mocking/provide-switchable-adapter';
import { IdempotencyAdapterKeys } from './idempotency-adapter-keys';
import { IDEMPOTENCY_STORE, IdempotencyStorePort } from './idempotency-store.port';
import { InMemoryIdempotencyStore } from './in-memory-idempotency.store';
import { RedisIdempotencyStore } from './redis-idempotency.store';

@Global()
@Module({
  providers: [
    provideSwitchableAdapter<IdempotencyStorePort>({
      provide: IDEMPOTENCY_STORE,
      key: IdempotencyAdapterKeys.store,
      real: RedisIdempotencyStore,
      mock: InMemoryIdempotencyStore,
    }),
  ],
  exports: [IDEMPOTENCY_STORE],
})
export class IdempotencyModule {}
