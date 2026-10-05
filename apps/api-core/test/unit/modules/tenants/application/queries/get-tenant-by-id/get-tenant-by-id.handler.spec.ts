import { GetTenantByIdHandler } from '@modules/tenants/application/queries/get-tenant-by-id/get-tenant-by-id.handler';
import { GetTenantByIdQuery } from '@modules/tenants/application/queries/get-tenant-by-id/get-tenant-by-id.query';
import { TenantNotFoundError } from '@modules/tenants/domain/errors/tenant.errors';
import { Tenant } from '@modules/tenants/domain/tenant';
import { TenantName } from '@modules/tenants/domain/value-objects/tenant-name';
import { TenantSlug } from '@modules/tenants/domain/value-objects/tenant-slug';
import { InMemoryTenantRepository } from '@modules/tenants/infrastructure/mocks/in-memory-tenant.repository';

describe('GetTenantByIdHandler', () => {
  it('returns the tenant view without infrastructure details', async () => {
    const tenants = new InMemoryTenantRepository();
    const tenant = Tenant.register(TenantSlug.create('acme'), TenantName.create('Acme Corp'));
    await tenants.save(tenant);

    const view = await new GetTenantByIdHandler(tenants).execute(new GetTenantByIdQuery(tenant.id));

    expect(view).toMatchObject({ id: tenant.id, slug: 'acme', name: 'Acme Corp' });
    expect(view).not.toHaveProperty('databaseName');
  });

  it('throws when the tenant does not exist', async () => {
    const handler = new GetTenantByIdHandler(new InMemoryTenantRepository());

    await expect(handler.execute(new GetTenantByIdQuery('00000000-0000-4000-8000-000000000099'))).rejects.toThrow(
      TenantNotFoundError,
    );
  });
});
