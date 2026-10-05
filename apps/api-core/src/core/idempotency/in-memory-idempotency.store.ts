import { Injectable } from '@nestjs/common';
import {
  IdempotencyRecord,
  IdempotencyReservation,
  IdempotencyStorePort,
  StoredIdempotentResponse,
  reservationFor,
} from './idempotency-store.port';

interface ExpiringRecord {
  readonly serializedRecord: string;
  readonly expiresAt: number;
}

@Injectable()
export class InMemoryIdempotencyStore implements IdempotencyStorePort {
  private readonly records = new Map<string, ExpiringRecord>();

  async reserve(key: string, fingerprint: string, lockTtlMs: number): Promise<IdempotencyReservation> {
    const existing = this.records.get(key);
    if (existing && existing.expiresAt > Date.now()) {
      return reservationFor(JSON.parse(existing.serializedRecord) as IdempotencyRecord, fingerprint);
    }
    this.store(key, { state: 'in-progress', fingerprint }, lockTtlMs);
    return { outcome: 'acquired' };
  }

  async complete(
    key: string,
    fingerprint: string,
    response: StoredIdempotentResponse,
    retentionMs: number,
  ): Promise<void> {
    this.store(key, { state: 'completed', fingerprint, response }, retentionMs);
  }

  async release(key: string): Promise<void> {
    this.records.delete(key);
  }

  private store(key: string, record: IdempotencyRecord, ttlMs: number): void {
    this.records.set(key, { serializedRecord: JSON.stringify(record), expiresAt: Date.now() + ttlMs });
  }
}
