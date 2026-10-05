import { Tenant } from '../../domain/tenant';
import { TenantStatus } from '../../domain/tenant-status';

export interface TenantView {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly status: TenantStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export function toTenantView(tenant: Tenant): TenantView {
  const { id, slug, name, status, createdAt, updatedAt } = tenant.toSnapshot();
  return { id, slug, name, status, createdAt, updatedAt };
}
