import { tenantDatabaseNameFor } from '@zaku/database-lib';
import { Tenant } from '../../../domain/tenant';
import { isTenantStatus } from '../../../domain/tenant-status';
import { TenantOrmEntity } from './tenant.orm-entity';

export function toTenantOrmEntity(tenant: Tenant): TenantOrmEntity {
  const snapshot = tenant.toSnapshot();
  return Object.assign(new TenantOrmEntity(), snapshot, { databaseName: tenantDatabaseNameFor(snapshot.id) });
}

export function toTenantDomain(entity: TenantOrmEntity): Tenant {
  if (!isTenantStatus(entity.status)) {
    throw new Error(`Tenant ${entity.id} has unknown status "${entity.status}"`);
  }
  return Tenant.restore({
    id: entity.id,
    slug: entity.slug,
    name: entity.name,
    status: entity.status,
    provisioningError: entity.provisioningError,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  });
}
