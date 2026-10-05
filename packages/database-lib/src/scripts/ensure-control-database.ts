import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { connectionOptionsFor, controlDatabaseName } from './connection-options';

const MAINTENANCE_DATABASE = 'postgres';

async function ensureControlDatabase(): Promise<void> {
  const databaseName = controlDatabaseName();
  const maintenance = await new DataSource(connectionOptionsFor(MAINTENANCE_DATABASE)).initialize();
  try {
    const existing: unknown[] = await maintenance.query('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName]);
    if (existing.length === 0) {
      await maintenance.query(`CREATE DATABASE "${databaseName}"`);
      console.log(`Created control database ${databaseName}`);
    }
  } finally {
    await maintenance.destroy();
  }
}

ensureControlDatabase().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
