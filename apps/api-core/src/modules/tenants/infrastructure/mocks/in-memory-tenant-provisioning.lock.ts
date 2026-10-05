import { Injectable } from '@nestjs/common';
import { TenantProvisioningLockPort } from '../../application/ports/tenant-provisioning-lock.port';
import { TenantProvisioningInProgressError } from '../../domain/errors/tenant.errors';

@Injectable()
export class InMemoryTenantProvisioningLock implements TenantProvisioningLockPort {
  private readonly lockedTenantIds = new Set<string>();

  async runExclusively<TResult>(tenantId: string, work: () => Promise<TResult>): Promise<TResult> {
    if (this.lockedTenantIds.has(tenantId)) {
      throw new TenantProvisioningInProgressError(tenantId);
    }
    this.lockedTenantIds.add(tenantId);
    try {
      return await work();
    } finally {
      this.lockedTenantIds.delete(tenantId);
    }
  }
}
