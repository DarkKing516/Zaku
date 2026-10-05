import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '@core/database/database.module';
import { provideSwitchableAdapter } from '@core/mocking/provide-switchable-adapter';
import { TENANT_ACCESS_CHECKER } from '@core/tenancy/tenant-access-checker.port';
import { CreateTenantHandler } from './application/commands/create-tenant/create-tenant.handler';
import { ProvisionTenantHandler } from './application/commands/provision-tenant/provision-tenant.handler';
import {
  TENANT_DATABASE_PROVISIONER,
  TenantDatabaseProvisionerPort,
} from './application/ports/tenant-database-provisioner.port';
import { TENANT_PROVISIONING_LOCK, TenantProvisioningLockPort } from './application/ports/tenant-provisioning-lock.port';
import { TENANT_REPOSITORY, TenantRepositoryPort } from './application/ports/tenant.repository.port';
import { GetTenantByIdHandler } from './application/queries/get-tenant-by-id/get-tenant-by-id.handler';
import { ListTenantsHandler } from './application/queries/list-tenants/list-tenants.handler';
import { TenantProvisioningWorkflow } from './application/services/tenant-provisioning.workflow';
import { PostgresTenantDatabaseProvisioner } from './infrastructure/adapters/postgres-tenant-database.provisioner';
import { PostgresTenantProvisioningLock } from './infrastructure/adapters/postgres-tenant-provisioning.lock';
import { RepositoryTenantAccessChecker } from './infrastructure/adapters/repository-tenant-access.checker';
import { TenantProvisioningDatabase } from './infrastructure/adapters/tenant-provisioning-database';
import { TenantsController } from './infrastructure/http/tenants.controller';
import { InMemoryTenantDatabaseProvisioner } from './infrastructure/mocks/in-memory-tenant-database.provisioner';
import { InMemoryTenantProvisioningLock } from './infrastructure/mocks/in-memory-tenant-provisioning.lock';
import { InMemoryTenantRepository } from './infrastructure/mocks/in-memory-tenant.repository';
import { TenantsMockSeeder } from './infrastructure/mocks/tenants-mock.seeder';
import { TenantOrmEntity } from './infrastructure/persistence/typeorm/tenant.orm-entity';
import { TypeOrmTenantRepository } from './infrastructure/persistence/typeorm/typeorm-tenant.repository';
import { TenantsAdapterKeys } from './infrastructure/tenants-adapter-keys';

// Global only to expose TENANT_ACCESS_CHECKER, the port that the core TenantAccessGuard depends on.
@Global()
@Module({
  imports: [DatabaseModule.forFeature({ controlPlane: [TenantOrmEntity] })],
  controllers: [TenantsController],
  providers: [
    TenantProvisioningWorkflow,
    CreateTenantHandler,
    ProvisionTenantHandler,
    GetTenantByIdHandler,
    ListTenantsHandler,
    provideSwitchableAdapter<TenantRepositoryPort>({
      provide: TENANT_REPOSITORY,
      key: TenantsAdapterKeys.repository,
      real: TypeOrmTenantRepository,
      mock: InMemoryTenantRepository,
    }),
    provideSwitchableAdapter<TenantDatabaseProvisionerPort>({
      provide: TENANT_DATABASE_PROVISIONER,
      key: TenantsAdapterKeys.databaseProvisioner,
      real: PostgresTenantDatabaseProvisioner,
      mock: InMemoryTenantDatabaseProvisioner,
    }),
    provideSwitchableAdapter<TenantProvisioningLockPort>({
      provide: TENANT_PROVISIONING_LOCK,
      key: TenantsAdapterKeys.provisioningLock,
      real: PostgresTenantProvisioningLock,
      mock: InMemoryTenantProvisioningLock,
    }),
    TenantProvisioningDatabase,
    { provide: TENANT_ACCESS_CHECKER, useClass: RepositoryTenantAccessChecker },
    TenantsMockSeeder,
  ],
  exports: [TENANT_ACCESS_CHECKER],
})
export class TenantsModule {}
