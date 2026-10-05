import { InMemoryIdempotencyStore } from '@core/idempotency/in-memory-idempotency.store';
import { describeIdempotencyStoreContract } from '@test/contracts/idempotency-store.contract';

describeIdempotencyStoreContract('InMemoryIdempotencyStore', () => new InMemoryIdempotencyStore());

describe('InMemoryIdempotencyStore', () => {
  it('keeps a snapshot of the response, so later mutations of the body do not leak into replays', async () => {
    const store = new InMemoryIdempotencyStore();
    const body = { id: 1 };
    await store.reserve('key', 'fingerprint', 60_000);
    await store.complete('key', 'fingerprint', { statusCode: 201, body }, 60_000);

    body.id = 2;

    await expect(store.reserve('key', 'fingerprint', 60_000)).resolves.toEqual({
      outcome: 'completed',
      response: { statusCode: 201, body: { id: 1 } },
    });
  });
});
