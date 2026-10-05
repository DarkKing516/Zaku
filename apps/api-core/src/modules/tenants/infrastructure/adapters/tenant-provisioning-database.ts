import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppConfig } from '@core/config/app-config';
import { LazyDataSource } from '@core/database/lazy-data-source';
import { PostgresDataSourceFactory } from '@core/database/postgres-data-source.factory';

const PROVISIONING_POOL_MAX = 4;

// Dedicated pool for long-held provisioning lock sessions, so they never starve the pool that serves every request.
@Injectable()
export class TenantProvisioningDatabase implements OnApplicationShutdown {
  private readonly lazyDataSource: LazyDataSource;

  constructor(config: AppConfig, dataSourceFactory: PostgresDataSourceFactory) {
    this.lazyDataSource = new LazyDataSource(() =>
      dataSourceFactory.open({
        databaseName: config.database.controlDatabaseName,
        entities: [],
        poolMax: PROVISIONING_POOL_MAX,
      }),
    );
  }

  dataSource(): Promise<DataSource> {
    return this.lazyDataSource.get();
  }

  onApplicationShutdown(): Promise<void> {
    return this.lazyDataSource.destroy();
  }
}
