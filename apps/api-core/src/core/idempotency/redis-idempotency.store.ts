import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import Redis from 'ioredis';
import { AppConfig } from '../config/app-config';
import { IdempotencyStoreUnavailableError } from './idempotency.errors';
import {
  IdempotencyRecord,
  IdempotencyReservation,
  IdempotencyStorePort,
  StoredIdempotentResponse,
  reservationFor,
} from './idempotency-store.port';

const MAX_RESERVATION_ATTEMPTS = 2;

@Injectable()
export class RedisIdempotencyStore implements IdempotencyStorePort, OnApplicationShutdown {
  private readonly logger = new Logger(RedisIdempotencyStore.name);
  private readonly client: Redis;

  constructor(config: AppConfig) {
    this.client = new Redis(config.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      connectTimeout: 5000,
      commandTimeout: 2000,
    });
    this.client.on('error', (error: Error) => this.logger.warn(`Redis connection error: ${error.message}`));
  }

  async reserve(key: string, fingerprint: string, lockTtlMs: number): Promise<IdempotencyReservation> {
    const inProgress = JSON.stringify({ state: 'in-progress', fingerprint } satisfies IdempotencyRecord);

    for (let attempt = 0; attempt < MAX_RESERVATION_ATTEMPTS; attempt += 1) {
      const acquired = await this.run(() => this.client.set(key, inProgress, 'PX', lockTtlMs, 'NX'));
      if (acquired === 'OK') {
        return { outcome: 'acquired' };
      }
      const stored = await this.run(() => this.client.get(key));
      if (stored !== null) {
        return reservationFor(JSON.parse(stored) as IdempotencyRecord, fingerprint);
      }
    }
    return { outcome: 'in-progress' };
  }

  async complete(
    key: string,
    fingerprint: string,
    response: StoredIdempotentResponse,
    retentionMs: number,
  ): Promise<void> {
    const completed = JSON.stringify({ state: 'completed', fingerprint, response } satisfies IdempotencyRecord);
    await this.run(() => this.client.set(key, completed, 'PX', retentionMs));
  }

  async release(key: string): Promise<void> {
    await this.run(() => this.client.del(key));
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.client.status === 'ready') {
      await this.client.quit();
    } else {
      this.client.disconnect();
    }
  }

  private async run<TResult>(command: () => Promise<TResult>): Promise<TResult> {
    try {
      return await command();
    } catch (error) {
      throw new IdempotencyStoreUnavailableError(error);
    }
  }
}
