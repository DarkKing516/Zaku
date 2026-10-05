import { DataSource } from 'typeorm';
import { ControlPlaneDatabase } from '@core/database/control-plane-database';
import { DataSourceBlueprint, PostgresDataSourceFactory } from '@core/database/postgres-data-source.factory';
import { buildAppConfig } from '@test/support/app-config.fixture';
import { initializedFakeDataSource } from '@test/support/fake-data-source';

class ScriptedDataSourceFactory extends PostgresDataSourceFactory {
  readonly openedDatabases: string[] = [];
  readonly destroyedDatabases: string[] = [];
  failuresLeft = 0;

  constructor() {
    super(buildAppConfig());
  }

  override async open(blueprint: DataSourceBlueprint): Promise<DataSource> {
    this.openedDatabases.push(blueprint.databaseName);
    if (this.failuresLeft > 0) {
      this.failuresLeft -= 1;
      throw new Error('connection refused');
    }
    return initializedFakeDataSource(blueprint.databaseName, this.destroyedDatabases);
  }
}

describe('ControlPlaneDatabase', () => {
  let factory: ScriptedDataSourceFactory;
  let database: ControlPlaneDatabase;

  beforeEach(() => {
    factory = new ScriptedDataSourceFactory();
    database = new ControlPlaneDatabase(buildAppConfig(), factory);
  });

  it('does not connect until the first use and then reuses the connection', async () => {
    expect(factory.openedDatabases).toEqual([]);

    const [first, second] = await Promise.all([database.dataSource(), database.dataSource()]);

    expect(first).toBe(second);
    expect(factory.openedDatabases).toEqual(['zaku_control_test']);
  });

  it('forgets a failed connection so the next call retries', async () => {
    factory.failuresLeft = 1;

    await expect(database.dataSource()).rejects.toThrow('connection refused');
    await expect(database.dataSource()).resolves.toBeInstanceOf(DataSource);
    expect(factory.openedDatabases).toHaveLength(2);
  });

  it('closes the connection on shutdown and tolerates never having connected', async () => {
    await database.onApplicationShutdown();
    await database.dataSource();

    await database.onApplicationShutdown();

    expect(factory.destroyedDatabases).toEqual(['zaku_control_test']);
  });

  it('tolerates a failed connection during shutdown', async () => {
    factory.failuresLeft = 1;
    await expect(database.dataSource()).rejects.toThrow();

    await expect(database.onApplicationShutdown()).resolves.toBeUndefined();
  });
});
