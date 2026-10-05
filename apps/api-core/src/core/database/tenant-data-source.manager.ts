import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { tenantDatabaseNameFor } from '@zaku/database-lib';
import { AppConfig } from '../config/app-config';
import { LazyDataSource } from './lazy-data-source';
import { OrmEntityRegistry } from './orm-entity-registry';
import { PostgresDataSourceFactory } from './postgres-data-source.factory';

@Injectable()
export class TenantDataSourceManager implements OnApplicationShutdown {
  private readonly dataSourcesByDatabase = new Map<string, LazyDataSource>();

  constructor(
    private readonly config: AppConfig,
    private readonly dataSourceFactory: PostgresDataSourceFactory,
  ) {}

  dataSourceFor(tenantId: string): Promise<DataSource> {
    const databaseName = tenantDatabaseNameFor(tenantId);
    let lazyDataSource = this.dataSourcesByDatabase.get(databaseName);
    if (!lazyDataSource) {
      lazyDataSource = new LazyDataSource(() =>
        this.dataSourceFactory.open({
          databaseName,
          entities: OrmEntityRegistry.tenantEntities(),
          poolMax: this.config.database.tenantPoolMax,
        }),
      );
      this.dataSourcesByDatabase.set(databaseName, lazyDataSource);
    }
    return lazyDataSource.get();
  }

  get openConnectionCount(): number {
    return [...this.dataSourcesByDatabase.values()].filter((lazyDataSource) => lazyDataSource.isOpenOrOpening).length;
  }

  async onApplicationShutdown(): Promise<void> {
    const lazyDataSources = [...this.dataSourcesByDatabase.values()];
    this.dataSourcesByDatabase.clear();
    await Promise.allSettled(lazyDataSources.map((lazyDataSource) => lazyDataSource.destroy()));
  }
}
