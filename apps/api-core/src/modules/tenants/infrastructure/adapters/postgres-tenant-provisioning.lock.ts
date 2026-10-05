import { Injectable, Logger } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { TenantProvisioningLockPort } from '../../application/ports/tenant-provisioning-lock.port';
import { TenantProvisioningInProgressError } from '../../domain/errors/tenant.errors';
import { TenantProvisioningDatabase } from './tenant-provisioning-database';

interface AdvisoryLockRow {
  readonly acquired: boolean;
}

export function provisioningLockKey(tenantId: string): string {
  return `tenant-provisioning:${tenantId}`;
}

@Injectable()
export class PostgresTenantProvisioningLock implements TenantProvisioningLockPort {
  private readonly logger = new Logger(PostgresTenantProvisioningLock.name);

  constructor(private readonly provisioningDatabase: TenantProvisioningDatabase) {}

  async runExclusively<TResult>(tenantId: string, work: () => Promise<TResult>): Promise<TResult> {
    const lockKey = provisioningLockKey(tenantId);
    const session = (await this.provisioningDatabase.dataSource()).createQueryRunner();
    await session.connect();
    try {
      // Session-level advisory lock: one provisioning per tenant across all API instances, released if the session dies.
      const [lock] = (await session.query('SELECT pg_try_advisory_lock(hashtext($1)) AS acquired', [
        lockKey,
      ])) as AdvisoryLockRow[];
      if (!lock?.acquired) {
        throw new TenantProvisioningInProgressError(tenantId);
      }
      try {
        return await work();
      } finally {
        await this.unlock(session, lockKey);
      }
    } finally {
      await session.release();
    }
  }

  private async unlock(session: QueryRunner, lockKey: string): Promise<void> {
    try {
      await session.query('SELECT pg_advisory_unlock(hashtext($1))', [lockKey]);
    } catch (error) {
      this.logger.error(`Could not release ${lockKey}; clearing every lock of the session`, error instanceof Error ? error.stack : error);
      await session.query('SELECT pg_advisory_unlock_all()').catch(() => undefined);
    }
  }
}
