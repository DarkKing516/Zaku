import { DataSource } from 'typeorm';
import { tenantDatabaseNameFor } from '@zaku/database-lib';
import { DataSourceBlueprint, PostgresDataSourceFactory } from '@core/database/postgres-data-source.factory';
import { TenantDataSourceManager } from '@core/database/tenant-data-source.manager';
import { buildAppConfig } from '@test/support/app-config.fixture';
import { initializedFakeDataSource } from '@test/support/fake-data-source';

const tenantA = '0a000000-0000-4000-8000-00000000000a';
const tenantB = '0b000000-0000-4000-8000-00000000000b';

class FakeDataSourceFactory extends PostgresDataSourceFactory {
  readonly openedDatabases: string[] = [];
  readonly destroyedDatabases: string[] = [];
  failuresLeft = 0;

  constructor() {
    super(buildAppConfig());
  }

  override async open(blueprint: DataSourceBlueprint): Promise<DataSource> {
    this.openedDatabases.push(blueprint.databaseName);
    await new Promise((resolve) => setImmediate(resolve));
    if (this.failuresLeft > 0) {
      this.failuresLeft -= 1;
      throw new Error('connection refused');
    }
    return initializedFakeDataSource(blueprint.databaseName, this.destroyedDatabases);
  }
}

describe('TenantDataSourceManager', () => {
  let factory: FakeDataSourceFactory;
  let manager: TenantDataSourceManager;

  beforeEach(() => {
    factory = new FakeDataSourceFactory();
    manager = new TenantDataSourceManager(buildAppConfig(), factory);
  });

  it('opens one connection per tenant database and reuses it', async () => {
    const [first, second] = await Promise.all([manager.dataSourceFor(tenantA), manager.dataSourceFor(tenantA)]);
    const third = await manager.dataSourceFor(tenantA);

    expect(first).toBe(second);
    expect(third).toBe(first);
    expect(factory.openedDatabases).toEqual([tenantDatabaseNameFor(tenantA)]);
  });

  it('isolates tenants in different databases', async () => {
    const dataSourceA = await manager.dataSourceFor(tenantA);
    const dataSourceB = await manager.dataSourceFor(tenantB);

    expect(dataSourceA).not.toBe(dataSourceB);
    expect(manager.openConnectionCount).toBe(2);
  });

  it('forgets failed connection attempts so the next request retries', async () => {
    factory.failuresLeft = 1;

    await expect(manager.dataSourceFor(tenantA)).rejects.toThrow('connection refused');
    await expect(manager.dataSourceFor(tenantA)).resolves.toBeInstanceOf(DataSource);
    expect(factory.openedDatabases).toHaveLength(2);
  });

  it('closes every open connection on shutdown', async () => {
    await manager.dataSourceFor(tenantA);
    await manager.dataSourceFor(tenantB);

    await manager.onApplicationShutdown();

    expect(factory.destroyedDatabases.sort()).toEqual(factory.openedDatabases.sort());
    expect(manager.openConnectionCount).toBe(0);
  });
});
