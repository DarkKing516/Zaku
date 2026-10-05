import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppConfig } from '../config/app-config';
import { LazyDataSource } from './lazy-data-source';
import { OrmEntityRegistry } from './orm-entity-registry';
import { PostgresDataSourceFactory } from './postgres-data-source.factory';

const CONTROL_PLANE_POOL_MAX = 10;

@Injectable()
export class ControlPlaneDatabase implements OnApplicationShutdown {
  private readonly lazyDataSource: LazyDataSource;

  constructor(config: AppConfig, dataSourceFactory: PostgresDataSourceFactory) {
    this.lazyDataSource = new LazyDataSource(() =>
      dataSourceFactory.open({
        databaseName: config.database.controlDatabaseName,
        entities: OrmEntityRegistry.controlPlaneEntities(),
        poolMax: CONTROL_PLANE_POOL_MAX,
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
