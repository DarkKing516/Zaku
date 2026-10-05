import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { connectionOptionsFor, controlDatabaseName } from '../scripts/connection-options';
import { controlPlaneMigrations } from './migrations';

export const ControlPlaneDataSource = new DataSource({
  ...connectionOptionsFor(controlDatabaseName()),
  migrations: controlPlaneMigrations,
});
