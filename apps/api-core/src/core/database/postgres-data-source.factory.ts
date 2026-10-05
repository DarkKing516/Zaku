import { Injectable } from '@nestjs/common';
import { DataSource, MigrationInterface } from 'typeorm';
import { AppConfig } from '../config/app-config';
import { DatabaseUnavailableError } from './database.errors';
import { OrmEntityClass } from './orm-entity-registry';

export type MigrationClass = new () => MigrationInterface;

export interface DataSourceBlueprint {
  readonly databaseName: string;
  readonly entities: readonly OrmEntityClass[];
  readonly migrations?: readonly MigrationClass[];
  readonly poolMax: number;
}

@Injectable()
export class PostgresDataSourceFactory {
  constructor(private readonly config: AppConfig) {}

  async open(blueprint: DataSourceBlueprint): Promise<DataSource> {
    const database = this.config.database;
    const dataSource = new DataSource({
      type: 'postgres',
      host: database.host,
      port: database.port,
      username: database.user,
      password: database.password,
      ssl: database.ssl ? { rejectUnauthorized: true } : false,
      database: blueprint.databaseName,
      entities: [...blueprint.entities],
      migrations: [...(blueprint.migrations ?? [])],
      synchronize: false,
      logging: false,
      extra: {
        max: blueprint.poolMax,
        idleTimeoutMillis: database.poolIdleTimeoutMs,
        connectionTimeoutMillis: database.connectionTimeoutMs,
        statement_timeout: database.statementTimeoutMs,
      },
    });

    try {
      return await dataSource.initialize();
    } catch (error) {
      throw new DatabaseUnavailableError(blueprint.databaseName, error);
    }
  }
}
