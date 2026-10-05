import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { tenantMigrations } from '../tenant/migrations';
import { tenantDatabaseNameFor } from '../tenant/tenant-database-name';
import { connectionOptionsFor, controlDatabaseName } from './connection-options';

const MIGRATABLE_STATUSES = ['ACTIVE', 'SUSPENDED'];

interface TenantRow {
  id: string;
}

async function listTenantDatabases(): Promise<string[]> {
  const controlPlane = await new DataSource(connectionOptionsFor(controlDatabaseName())).initialize();
  try {
    const rows: TenantRow[] = await controlPlane.query('SELECT id FROM tenants WHERE status = ANY($1) ORDER BY created_at', [
      MIGRATABLE_STATUSES,
    ]);
    return rows.map((row) => tenantDatabaseNameFor(row.id));
  } finally {
    await controlPlane.destroy();
  }
}

async function migrateTenantDatabase(databaseName: string): Promise<number> {
  const tenantDatabase = await new DataSource({
    ...connectionOptionsFor(databaseName),
    migrations: tenantMigrations,
  }).initialize();
  try {
    return (await tenantDatabase.runMigrations({ transaction: 'each' })).length;
  } finally {
    await tenantDatabase.destroy();
  }
}

async function migrateTenantDatabases(): Promise<void> {
  const failures: string[] = [];
  for (const databaseName of await listTenantDatabases()) {
    try {
      console.log(`${databaseName}: ${await migrateTenantDatabase(databaseName)} migration(s) applied`);
    } catch (error) {
      failures.push(databaseName);
      console.error(`${databaseName}: migration failed`, error);
    }
  }
  if (failures.length > 0) {
    throw new Error(`Migrations failed for ${failures.length} tenant database(s): ${failures.join(', ')}`);
  }
}

migrateTenantDatabases().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
