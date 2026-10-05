import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  TenantNotFoundError,
  TenantProvisioningFailedError,
} from '../../domain/errors/tenant.errors';
import { Tenant } from '../../domain/tenant';
import { TENANT_DATABASE_PROVISIONER, TenantDatabaseProvisionerPort } from '../ports/tenant-database-provisioner.port';
import { TENANT_PROVISIONING_LOCK, TenantProvisioningLockPort } from '../ports/tenant-provisioning-lock.port';
import { TENANT_REPOSITORY, TenantRepositoryPort } from '../ports/tenant.repository.port';
import { TenantView, toTenantView } from '../views/tenant.view';

@Injectable()
export class TenantProvisioningWorkflow {
  private readonly logger = new Logger(TenantProvisioningWorkflow.name);

  constructor(
    @Inject(TENANT_REPOSITORY) private readonly tenants: TenantRepositoryPort,
    @Inject(TENANT_DATABASE_PROVISIONER) private readonly databaseProvisioner: TenantDatabaseProvisionerPort,
    @Inject(TENANT_PROVISIONING_LOCK) private readonly provisioningLock: TenantProvisioningLockPort,
  ) {}

  provisionNewTenant(tenant: Tenant): Promise<TenantView> {
    return this.provisioningLock.runExclusively(tenant.id, async () => {
      await this.tenants.save(tenant);
      return this.provision(tenant);
    });
  }

  retryProvisioning(tenantId: string): Promise<TenantView> {
    return this.provisioningLock.runExclusively(tenantId, async () => {
      const tenant = await this.tenants.findById(tenantId);
      if (!tenant) {
        throw new TenantNotFoundError(tenantId);
      }
      tenant.beginProvisioning();
      await this.tenants.save(tenant);
      return this.provision(tenant);
    });
  }

  private async provision(tenant: Tenant): Promise<TenantView> {
    try {
      await this.databaseProvisioner.provision(tenant.id);
    } catch (error) {
      this.logger.error(`Provisioning of tenant ${tenant.id} failed`, error instanceof Error ? error.stack : error);
      tenant.failProvisioning(error instanceof Error ? error.message : String(error));
      await this.tenants.save(tenant);
      throw new TenantProvisioningFailedError(tenant.id, error);
    }

    tenant.completeProvisioning();
    await this.tenants.save(tenant);
    return toTenantView(tenant);
  }
}
