import { Injectable } from '@nestjs/common';
import { TenantDatabaseProvisionerPort } from '../../application/ports/tenant-database-provisioner.port';

@Injectable()
export class InMemoryTenantDatabaseProvisioner implements TenantDatabaseProvisionerPort {
  private readonly provisionedTenantIds = new Set<string>();
  private pendingSimulatedFailures = 0;

  async provision(tenantId: string): Promise<void> {
    if (this.pendingSimulatedFailures > 0) {
      this.pendingSimulatedFailures -= 1;
      throw new Error(`Simulated provisioning failure for tenant ${tenantId}`);
    }
    this.provisionedTenantIds.add(tenantId);
  }

  failNextProvisioning(): void {
    this.pendingSimulatedFailures += 1;
  }

  isProvisioned(tenantId: string): boolean {
    return this.provisionedTenantIds.has(tenantId);
  }
}
