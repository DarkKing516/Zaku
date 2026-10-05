import { DataSource, QueryRunner } from 'typeorm';
import { TenantProvisioningInProgressError } from '@modules/tenants/domain/errors/tenant.errors';
import { PostgresTenantProvisioningLock } from '@modules/tenants/infrastructure/adapters/postgres-tenant-provisioning.lock';
import { TenantProvisioningDatabase } from '@modules/tenants/infrastructure/adapters/tenant-provisioning-database';

class ScriptedSession {
  readonly executedQueries: string[] = [];
  released = false;

  constructor(
    private readonly lockAvailable: boolean,
    private readonly unlockFails: boolean,
  ) {}

  async connect(): Promise<void> {}

  async query(sql: string): Promise<unknown> {
    this.executedQueries.push(sql);
    if (sql.includes('pg_try_advisory_lock')) {
      return [{ acquired: this.lockAvailable }];
    }
    if (sql.includes('pg_advisory_unlock(') && this.unlockFails) {
      throw new Error('connection reset while unlocking');
    }
    return [];
  }

  async release(): Promise<void> {
    this.released = true;
  }
}

function lockWith(session: ScriptedSession): PostgresTenantProvisioningLock {
  const dataSource = { createQueryRunner: () => session as unknown as QueryRunner } as unknown as DataSource;
  const provisioningDatabase = { dataSource: async () => dataSource } as unknown as TenantProvisioningDatabase;
  return new PostgresTenantProvisioningLock(provisioningDatabase);
}

describe('PostgresTenantProvisioningLock', () => {
  it('runs the work, unlocks and returns the session to the pool', async () => {
    const session = new ScriptedSession(true, false);

    await expect(lockWith(session).runExclusively('tenant-1', async () => 'done')).resolves.toBe('done');

    expect(session.executedQueries.some((sql) => sql.includes('pg_advisory_unlock('))).toBe(true);
    expect(session.released).toBe(true);
  });

  it('reports a busy lock without running the work', async () => {
    const session = new ScriptedSession(false, false);
    const work = jest.fn(async () => 'never');

    await expect(lockWith(session).runExclusively('tenant-1', work)).rejects.toThrow(TenantProvisioningInProgressError);

    expect(work).not.toHaveBeenCalled();
    expect(session.released).toBe(true);
  });

  it('does not hide the result of the work when unlocking fails, and clears the session locks', async () => {
    const session = new ScriptedSession(true, true);

    await expect(lockWith(session).runExclusively('tenant-1', async () => 'done')).resolves.toBe('done');

    expect(session.executedQueries).toContain('SELECT pg_advisory_unlock_all()');
    expect(session.released).toBe(true);
  });
});
