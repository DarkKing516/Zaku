import { ListTenantsHandler } from '@modules/tenants/application/queries/list-tenants/list-tenants.handler';
import { ListTenantsQuery } from '@modules/tenants/application/queries/list-tenants/list-tenants.query';
import { Tenant } from '@modules/tenants/domain/tenant';
import { TenantName } from '@modules/tenants/domain/value-objects/tenant-name';
import { TenantSlug } from '@modules/tenants/domain/value-objects/tenant-slug';
import { InMemoryTenantRepository } from '@modules/tenants/infrastructure/mocks/in-memory-tenant.repository';

describe('ListTenantsHandler', () => {
  it('returns the requested page of tenant views', async () => {
    const tenants = new InMemoryTenantRepository();
    for (const slug of ['alpha', 'bravo', 'charlie']) {
      await tenants.save(Tenant.register(TenantSlug.create(slug), TenantName.create(slug)));
    }

    const page = await new ListTenantsHandler(tenants).execute(new ListTenantsQuery({ page: 2, pageSize: 2 }));

    expect(page.items).toHaveLength(1);
    expect(page).toMatchObject({ page: 2, pageSize: 2, totalItems: 3, totalPages: 2 });
  });
});
