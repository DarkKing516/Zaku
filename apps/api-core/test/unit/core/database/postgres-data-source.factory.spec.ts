import { DataSource } from 'typeorm';
import { DatabaseUnavailableError } from '@core/database/database.errors';
import { PostgresDataSourceFactory } from '@core/database/postgres-data-source.factory';
import { buildAppConfig } from '@test/support/app-config.fixture';

const blueprint = { databaseName: 'zaku_t_sample', entities: [], poolMax: 3 };

describe('PostgresDataSourceFactory', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  function stubSuccessfulConnection(): jest.SpyInstance {
    return jest.spyOn(DataSource.prototype, 'initialize').mockImplementation(function (this: DataSource) {
      return Promise.resolve(this);
    });
  }

  it('opens a schema-locked data source with the pool size of the blueprint and the configured timeouts', async () => {
    const initialize = stubSuccessfulConnection();

    const dataSource = await new PostgresDataSourceFactory(buildAppConfig()).open(blueprint);

    expect(initialize).toHaveBeenCalledTimes(1);
    expect(dataSource.options).toMatchObject({
      type: 'postgres',
      database: 'zaku_t_sample',
      synchronize: false,
      ssl: false,
      extra: { max: 3, idleTimeoutMillis: 1000, connectionTimeoutMillis: 1000, statement_timeout: 5000 },
    });
  });

  it('verifies the server certificate when SSL is enabled', async () => {
    stubSuccessfulConnection();
    const config = buildAppConfig();

    const dataSource = await new PostgresDataSourceFactory(
      buildAppConfig({ database: { ...config.database, ssl: true } }),
    ).open(blueprint);

    expect(dataSource.options).toMatchObject({ ssl: { rejectUnauthorized: true } });
  });

  it('reports a database it cannot reach as DatabaseUnavailableError', async () => {
    jest.spyOn(DataSource.prototype, 'initialize').mockRejectedValue(new Error('connect ECONNREFUSED'));

    await expect(new PostgresDataSourceFactory(buildAppConfig()).open(blueprint)).rejects.toThrow(DatabaseUnavailableError);
  });
});
