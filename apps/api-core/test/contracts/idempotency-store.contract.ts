import { randomUUID } from 'node:crypto';
import { IdempotencyStorePort } from '@core/idempotency/idempotency-store.port';

async function eventually(assertion: () => Promise<boolean>, timeoutMs = 2000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!(await assertion())) {
    if (Date.now() > deadline) {
      throw new Error('Condition not met in time');
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

export function describeIdempotencyStoreContract(adapterName: string, createStore: () => IdempotencyStorePort): void {
  describe(`${adapterName} honours the IdempotencyStorePort contract`, () => {
    let store: IdempotencyStorePort;
    const newKey = () => `idempotency:contract:${randomUUID()}`;

    beforeAll(() => {
      store = createStore();
    });

    it('grants the lock to exactly one of several concurrent reservations', async () => {
      const key = newKey();

      const outcomes = await Promise.all(
        Array.from({ length: 5 }, () => store.reserve(key, 'fingerprint', 60_000).then((result) => result.outcome)),
      );

      expect(outcomes.filter((outcome) => outcome === 'acquired')).toHaveLength(1);
      expect(outcomes.filter((outcome) => outcome === 'in-progress')).toHaveLength(4);
    });

    it('replays a completed response serialized as JSON', async () => {
      const key = newKey();
      await store.reserve(key, 'fingerprint', 60_000);
      await store.complete(
        key,
        'fingerprint',
        { statusCode: 201, body: { id: 'tenant-1', createdAt: new Date('2026-01-01T00:00:00.000Z') } },
        60_000,
      );

      await expect(store.reserve(key, 'fingerprint', 60_000)).resolves.toEqual({
        outcome: 'completed',
        response: { statusCode: 201, body: { id: 'tenant-1', createdAt: '2026-01-01T00:00:00.000Z' } },
      });
    });

    it('detects a key reused with a different fingerprint, both in progress and completed', async () => {
      const inProgressKey = newKey();
      const completedKey = newKey();
      await store.reserve(inProgressKey, 'fingerprint', 60_000);
      await store.reserve(completedKey, 'fingerprint', 60_000);
      await store.complete(completedKey, 'fingerprint', { statusCode: 200, body: null }, 60_000);

      await expect(store.reserve(inProgressKey, 'other', 60_000)).resolves.toEqual({ outcome: 'fingerprint-mismatch' });
      await expect(store.reserve(completedKey, 'other', 60_000)).resolves.toEqual({ outcome: 'fingerprint-mismatch' });
    });

    it('frees a released key', async () => {
      const key = newKey();
      await store.reserve(key, 'fingerprint', 60_000);

      await store.release(key);

      await expect(store.reserve(key, 'fingerprint', 60_000)).resolves.toEqual({ outcome: 'acquired' });
    });

    it('lets an abandoned lock expire', async () => {
      const key = newKey();
      await store.reserve(key, 'fingerprint', 1);

      await eventually(async () => (await store.reserve(key, 'fingerprint', 60_000)).outcome === 'acquired');
    });
  });
}
