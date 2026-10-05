import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { controlPlaneMigrations, isTenantDatabaseName } from '@zaku/database-lib';

export const INTEGRATION_CONTROL_DATABASE = process.env.CONTROL_DATABASE_NAME ?? 'zaku_control_test';
const DATABASE_HOST = process.env.DATABASE_HOST ?? 'localhost';
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1'];

function assertDisposableTarget(): void {
  if (!INTEGRATION_CONTROL_DATABASE.endsWith('_test') || !LOCAL_HOSTS.includes(DATABASE_HOST)) {
    throw new Error(
      `Integration tests drop tenant databases; refusing to run against "${INTEGRATION_CONTROL_DATABASE}" on "${DATABASE_HOST}". ` +
        'Use a local control database whose name ends with "_test".',
    );
  }
}

function connectionTo(database: string, migrations: DataSource['options']['migrations'] = []): DataSource {
  return new DataSource({
    type: 'postgres',
    host: DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT ?? 5432),
    username: process.env.DATABASE_USER ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? 'postgres',
    database,
    migrations,
  });
}

export async function withDatabase<TResult>(
  database: string,
  work: (dataSource: DataSource) => Promise<TResult>,
): Promise<TResult> {
  const dataSource = await connectionTo(database).initialize();
  try {
    return await work(dataSource);
  } finally {
    await dataSource.destroy();
  }
}

export async function prepareControlDatabase(): Promise<void> {
  assertDisposableTarget();
  await withDatabase('postgres', async (maintenance) => {
    const existing = await maintenance.query<unknown[]>('SELECT 1 FROM pg_database WHERE datname = $1', [
      INTEGRATION_CONTROL_DATABASE,
    ]);
    if (existing.length === 0) {
      await maintenance.query(`CREATE DATABASE "${INTEGRATION_CONTROL_DATABASE}"`);
    }
  });
  const controlPlane = await connectionTo(INTEGRATION_CONTROL_DATABASE, controlPlaneMigrations).initialize();
  try {
    await controlPlane.runMigrations({ transaction: 'each' });
  } finally {
    await controlPlane.destroy();
  }
}

export async function dropTenantDatabasesCreatedByTests(): Promise<void> {
  assertDisposableTarget();
  const databaseNames = await withDatabase(INTEGRATION_CONTROL_DATABASE, async (controlPlane) => {
    const rows = await controlPlane.query<{ database_name: string }[]>('SELECT database_name FROM tenants');
    await controlPlane.query('DELETE FROM tenants');
    return rows.map((row) => row.database_name).filter(isTenantDatabaseName);
  });
  await withDatabase('postgres', async (maintenance) => {
    for (const databaseName of databaseNames) {
      await maintenance.query(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`);
    }
  });
}
