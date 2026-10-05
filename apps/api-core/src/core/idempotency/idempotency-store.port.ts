export const IDEMPOTENCY_STORE = Symbol('IDEMPOTENCY_STORE');

export interface StoredIdempotentResponse {
  readonly statusCode: number;
  readonly body: unknown;
}

export type IdempotencyReservation =
  | { readonly outcome: 'acquired' }
  | { readonly outcome: 'in-progress' }
  | { readonly outcome: 'fingerprint-mismatch' }
  | { readonly outcome: 'completed'; readonly response: StoredIdempotentResponse };

export interface IdempotencyStorePort {
  reserve(key: string, fingerprint: string, lockTtlMs: number): Promise<IdempotencyReservation>;
  complete(key: string, fingerprint: string, response: StoredIdempotentResponse, retentionMs: number): Promise<void>;
  release(key: string): Promise<void>;
}

export interface IdempotencyRecord {
  readonly state: 'in-progress' | 'completed';
  readonly fingerprint: string;
  readonly response?: StoredIdempotentResponse;
}

export function reservationFor(record: IdempotencyRecord, fingerprint: string): IdempotencyReservation {
  if (record.fingerprint !== fingerprint) {
    return { outcome: 'fingerprint-mismatch' };
  }
  if (record.state === 'completed' && record.response) {
    return { outcome: 'completed', response: record.response };
  }
  return { outcome: 'in-progress' };
}
