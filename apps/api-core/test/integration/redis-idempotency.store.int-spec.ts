import { RedisIdempotencyStore } from '@core/idempotency/redis-idempotency.store';
import { buildAppConfig } from '@test/support/app-config.fixture';
import { describeIdempotencyStoreContract } from '@test/contracts/idempotency-store.contract';

const store = new RedisIdempotencyStore(buildAppConfig({ redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379' }));

afterAll(async () => {
  await store.onApplicationShutdown();
});

describeIdempotencyStoreContract('RedisIdempotencyStore', () => store);
