import { Inject, Injectable } from '@nestjs/common';
import { TenantAccessCheckerPort } from '@core/tenancy/tenant-access-checker.port';
import { TENANT_REPOSITORY, TenantRepositoryPort } from '../../application/ports/tenant.repository.port';
import { TenantStatus } from '../../domain/tenant-status';

@Injectable()
export class RepositoryTenantAccessChecker implements TenantAccessCheckerPort {
  constructor(@Inject(TENANT_REPOSITORY) private readonly tenants: TenantRepositoryPort) {}

  async isTenantActive(tenantId: string): Promise<boolean> {
    const tenant = await this.tenants.findById(tenantId);
    return tenant?.status === TenantStatus.Active;
  }
}
