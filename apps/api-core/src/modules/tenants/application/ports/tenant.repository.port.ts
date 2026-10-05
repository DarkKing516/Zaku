import { Page, PageRequest } from '@common/pagination/page';
import { Tenant } from '../../domain/tenant';
import { TenantSlug } from '../../domain/value-objects/tenant-slug';

export const TENANT_REPOSITORY = Symbol('TENANT_REPOSITORY');

export interface TenantRepositoryPort {
  save(tenant: Tenant): Promise<void>;
  findById(tenantId: string): Promise<Tenant | null>;
  findBySlug(slug: TenantSlug): Promise<Tenant | null>;
  findPage(request: PageRequest): Promise<Page<Tenant>>;
}
