import { createHash, createHmac } from 'node:crypto';

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([leftKey], [rightKey]) => (leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0))
      .map(([entryKey, entryValue]) => `${JSON.stringify(entryKey)}:${canonicalJson(entryValue)}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export interface IdempotencyScope {
  readonly tenantId?: string;
  readonly subjectId?: string;
  readonly method: string;
  readonly route: string;
  readonly idempotencyKey: string;
}

export function idempotencyStorageKey(scope: IdempotencyScope): string {
  const scopeParts = [
    scope.tenantId ?? 'platform',
    scope.subjectId ?? 'anonymous',
    scope.method.toUpperCase(),
    scope.route,
    scope.idempotencyKey,
  ];
  return `idempotency:${sha256(canonicalJson(scopeParts))}`;
}

export function deriveFingerprintKey(masterSecret: string): Buffer {
  return createHash('sha256').update(`idempotency-fingerprint:${masterSecret}`).digest();
}

export function requestFingerprint(params: unknown, body: unknown, fingerprintKey: Buffer): string {
  // Keyed hash: bodies can contain passwords, so a plain digest stored in Redis would be crackable offline.
  return createHmac('sha256', fingerprintKey).update(canonicalJson({ params, body })).digest('hex');
}
