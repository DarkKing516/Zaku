import { Tenant } from '@modules/tenants/domain/tenant';
import { TenantName } from '@modules/tenants/domain/value-objects/tenant-name';
import { TenantSlug } from '@modules/tenants/domain/value-objects/tenant-slug';
import {
  toTenantDomain,
  toTenantOrmEntity,
} from '@modules/tenants/infrastructure/persistence/typeorm/tenant-orm.mapper';
import { TenantOrmEntity } from '@modules/tenants/infrastructure/persistence/typeorm/tenant.orm-entity';

describe('tenant ORM mapper', () => {
  it('round-trips a tenant through the ORM entity', () => {
    const tenant = Tenant.register(TenantSlug.create('acme'), TenantName.create('Acme Corp'));

    const entity = toTenantOrmEntity(tenant);

    expect(entity).toBeInstanceOf(TenantOrmEntity);
    expect(entity.databaseName).toBe(`zaku_t_${tenant.id.replace(/-/g, '')}`);
    expect(toTenantDomain(entity).toSnapshot()).toEqual(tenant.toSnapshot());
  });

  it('refuses rows with an unknown status instead of trusting the database blindly', () => {
    const entity = toTenantOrmEntity(Tenant.register(TenantSlug.create('acme'), TenantName.create('Acme Corp')));
    entity.status = 'DELETED';

    expect(() => toTenantDomain(entity)).toThrow(/unknown status/);
  });
});
