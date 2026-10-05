import { randomUUID } from 'node:crypto';
import { ControlPlaneDatabase } from '@core/database/control-plane-database';
import { OrmEntityRegistry } from '@core/database/orm-entity-registry';
import { PostgresDataSourceFactory } from '@core/database/postgres-data-source.factory';
import { TenantDataSourceManager } from '@core/database/tenant-data-source.manager';
import { Tenant } from '@modules/tenants/domain/tenant';
import { TenantName } from '@modules/tenants/domain/value-objects/tenant-name';
import { TenantSlug } from '@modules/tenants/domain/value-objects/tenant-slug';
import { PostgresTenantDatabaseProvisioner } from '@modules/tenants/infrastructure/adapters/postgres-tenant-database.provisioner';
import { PostgresTenantProvisioningLock } from '@modules/tenants/infrastructure/adapters/postgres-tenant-provisioning.lock';
import { TenantProvisioningDatabase } from '@modules/tenants/infrastructure/adapters/tenant-provisioning-database';
import { TenantOrmEntity } from '@modules/tenants/infrastructure/persistence/typeorm/tenant.orm-entity';
import { TypeOrmTenantRepository } from '@modules/tenants/infrastructure/persistence/typeorm/typeorm-tenant.repository';
import { TypeOrmUserRepository } from '@modules/users/infrastructure/persistence/typeorm/typeorm-user.repository';
import { UserOrmEntity } from '@modules/users/infrastructure/persistence/typeorm/user.orm-entity';
import { INTEGRATION_CONTROL_DATABASE } from '@test/setup/integration-database';
import { buildAppConfig } from '@test/support/app-config.fixture';
import { describeTenantDatabaseProvisionerContract } from '@test/contracts/tenant-database-provisioner.contract';
import { describeTenantProvisioningLockContract } from '@test/contracts/tenant-provisioning-lock.contract';
import { describeTenantRepositoryContract } from '@test/contracts/tenant-repository.contract';
import { describeUserRepositoryContract } from '@test/contracts/user-repository.contract';

OrmEntityRegistry.registerControlPlaneEntities([TenantOrmEntity]);
OrmEntityRegistry.registerTenantEntities([UserOrmEntity]);

const baseConfig = buildAppConfig();
const config = buildAppConfig({
  database: {
    ...baseConfig.database,
    host: process.env.DATABASE_HOST ?? 'localhost',
    controlDatabaseName: INTEGRATION_CONTROL_DATABASE,
    connectionTimeoutMs: 5000,
    statementTimeoutMs: 30_000,
  },
});
const dataSourceFactory = new PostgresDataSourceFactory(config);
const controlPlaneDatabase = new ControlPlaneDatabase(config, dataSourceFactory);
const tenantDataSources = new TenantDataSourceManager(config, dataSourceFactory);
const tenantRepository = new TypeOrmTenantRepository(controlPlaneDatabase);
const provisioner = new PostgresTenantDatabaseProvisioner(controlPlaneDatabase, dataSourceFactory);
const provisioningDatabase = new TenantProvisioningDatabase(config, dataSourceFactory);

async function registeredTenantId(): Promise<string> {
  const tenant = Tenant.register(TenantSlug.create(`contract-${randomUUID().slice(0, 8)}`), TenantName.create('Contract tenant'));
  await tenantRepository.save(tenant);
  return tenant.id;
}

async function provisionedTenantId(): Promise<string> {
  const tenantId = await registeredTenantId();
  await provisioner.provision(tenantId);
  return tenantId;
}

afterAll(async () => {
  await tenantDataSources.onApplicationShutdown();
  await controlPlaneDatabase.onApplicationShutdown();
  await provisioningDatabase.onApplicationShutdown();
});

describeTenantRepositoryContract('TypeOrmTenantRepository', () => tenantRepository);

describeUserRepositoryContract('TypeOrmUserRepository', async () => ({
  repository: new TypeOrmUserRepository(tenantDataSources),
  tenantA: await provisionedTenantId(),
  tenantB: await provisionedTenantId(),
}));

describeTenantProvisioningLockContract('PostgresTenantProvisioningLock', () => new PostgresTenantProvisioningLock(provisioningDatabase));

describeTenantDatabaseProvisionerContract('PostgresTenantDatabaseProvisioner', () => ({
  provisioner,
  registerTenantId: registeredTenantId,
}));
