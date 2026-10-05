import { Injectable } from '@nestjs/common';
import { isTenantDatabaseName, tenantDatabaseNameFor, tenantMigrations } from '@zaku/database-lib';
import { ControlPlaneDatabase } from '@core/database/control-plane-database';
import { PostgresDataSourceFactory } from '@core/database/postgres-data-source.factory';
import { TenantDatabaseProvisionerPort } from '../../application/ports/tenant-database-provisioner.port';

@Injectable()
export class PostgresTenantDatabaseProvisioner implements TenantDatabaseProvisionerPort {
  constructor(
    private readonly controlPlaneDatabase: ControlPlaneDatabase,
    private readonly dataSourceFactory: PostgresDataSourceFactory,
  ) {}

  async provision(tenantId: string): Promise<void> {
    const databaseName = tenantDatabaseNameFor(tenantId);
    if (!isTenantDatabaseName(databaseName)) {
      throw new Error(`Refusing to provision unexpected database name "${databaseName}"`);
    }
    await this.createDatabaseIfMissing(databaseName);
    await this.runTenantMigrations(databaseName);
  }

  private async createDatabaseIfMissing(databaseName: string): Promise<void> {
    const controlPlane = await this.controlPlaneDatabase.dataSource();
    const existing = await controlPlane.query<unknown[]>('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName]);
    if (existing.length > 0) {
      return;
    }
    // Identifiers cannot be bound as parameters; databaseName is derived from a UUID and validated above.
    await controlPlane.query(`CREATE DATABASE "${databaseName}"`);
  }

  private async runTenantMigrations(databaseName: string): Promise<void> {
    const tenantDatabase = await this.dataSourceFactory.open({
      databaseName,
      entities: [],
      migrations: tenantMigrations,
      poolMax: 1,
    });
    try {
      await tenantDatabase.runMigrations({ transaction: 'each' });
    } finally {
      await tenantDatabase.destroy();
    }
  }
}
