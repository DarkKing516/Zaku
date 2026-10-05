import { createHash } from 'node:crypto';
import {
  canonicalJson,
  deriveFingerprintKey,
  idempotencyStorageKey,
  requestFingerprint,
} from '@core/idempotency/request-fingerprint';

const fingerprintKey = deriveFingerprintKey('unit-test-secret');

describe('canonicalJson', () => {
  it('is independent of property order at any depth', () => {
    expect(canonicalJson({ b: 1, a: { d: [1, { y: 2, x: 1 }], c: null } })).toBe(
      canonicalJson({ a: { c: null, d: [1, { x: 1, y: 2 }] }, b: 1 }),
    );
  });

  it('omits undefined properties like JSON.stringify does', () => {
    expect(canonicalJson({ a: 1, b: undefined })).toBe('{"a":1}');
  });
});

describe('requestFingerprint', () => {
  it('changes when the payload or the route params change', () => {
    expect(requestFingerprint({}, { name: 'a' }, fingerprintKey)).not.toBe(
      requestFingerprint({}, { name: 'b' }, fingerprintKey),
    );
    expect(requestFingerprint({ id: '1' }, {}, fingerprintKey)).not.toBe(requestFingerprint({ id: '2' }, {}, fingerprintKey));
  });

  it('is keyed, so it cannot be recomputed from a guessed password without the server secret', () => {
    const body = { email: 'jane@example.com', password: 'guessable-password' };
    const plainDigest = createHash('sha256').update(canonicalJson({ params: {}, body })).digest('hex');

    expect(requestFingerprint({}, body, fingerprintKey)).not.toBe(plainDigest);
    expect(requestFingerprint({}, body, deriveFingerprintKey('another-secret'))).not.toBe(
      requestFingerprint({}, body, fingerprintKey),
    );
  });
});

describe('idempotencyStorageKey', () => {
  const base = { method: 'post', route: '/api/v1/users', idempotencyKey: 'key-12345' };

  it('separates identical keys sent by different tenants or users', () => {
    const keys = new Set([
      idempotencyStorageKey({ ...base, tenantId: 'tenant-a', subjectId: 'user-1' }),
      idempotencyStorageKey({ ...base, tenantId: 'tenant-b', subjectId: 'user-1' }),
      idempotencyStorageKey({ ...base, tenantId: 'tenant-a', subjectId: 'user-2' }),
      idempotencyStorageKey(base),
    ]);

    expect(keys.size).toBe(4);
  });

  it('produces a bounded, prefixed storage key', () => {
    expect(idempotencyStorageKey({ ...base, idempotencyKey: 'x'.repeat(255) })).toMatch(/^idempotency:[0-9a-f]{64}$/);
  });
});
