import { randomUUID } from 'node:crypto';
import { newestFirst } from '@common/pagination/newest-first';
import { TenantRepositoryPort } from '@modules/tenants/application/ports/tenant.repository.port';
import { TenantSlugTakenError } from '@modules/tenants/domain/errors/tenant.errors';
import { Tenant } from '@modules/tenants/domain/tenant';
import { TenantStatus } from '@modules/tenants/domain/tenant-status';
import { TenantName } from '@modules/tenants/domain/value-objects/tenant-name';
import { TenantSlug } from '@modules/tenants/domain/value-objects/tenant-slug';

function newTenant(): Tenant {
  const slug = `contract-${randomUUID().slice(0, 8)}`;
  return Tenant.register(TenantSlug.create(slug), TenantName.create(`Tenant ${slug}`));
}

export function describeTenantRepositoryContract(
  adapterName: string,
  createRepository: () => TenantRepositoryPort | Promise<TenantRepositoryPort>,
): void {
  describe(`${adapterName} honours the TenantRepositoryPort contract`, () => {
    let repository: TenantRepositoryPort;

    beforeAll(async () => {
      repository = await createRepository();
    });

    it('round-trips a tenant by id and by slug', async () => {
      const tenant = newTenant();
      await repository.save(tenant);

      expect((await repository.findById(tenant.id))?.toSnapshot()).toEqual(tenant.toSnapshot());
      expect((await repository.findBySlug(TenantSlug.create(tenant.slug)))?.id).toBe(tenant.id);
    });

    it('returns null for unknown tenants', async () => {
      await expect(repository.findById(randomUUID())).resolves.toBeNull();
      await expect(repository.findBySlug(TenantSlug.create(`missing-${randomUUID().slice(0, 8)}`))).resolves.toBeNull();
    });

    it('persists state transitions of an existing tenant', async () => {
      const tenant = newTenant();
      await repository.save(tenant);

      tenant.completeProvisioning();
      await repository.save(tenant);

      expect((await repository.findById(tenant.id))?.status).toBe(TenantStatus.Active);
    });

    it('rejects a second tenant with the same slug', async () => {
      const first = newTenant();
      await repository.save(first);
      const duplicate = Tenant.register(TenantSlug.create(first.slug), TenantName.create('Duplicate'));

      await expect(repository.save(duplicate)).rejects.toThrow(TenantSlugTakenError);
    });

    it('returns detached aggregates', async () => {
      const tenant = newTenant();
      await repository.save(tenant);

      (await repository.findById(tenant.id))?.completeProvisioning();

      expect((await repository.findById(tenant.id))?.status).toBe(TenantStatus.Provisioning);
    });

    it('pages newest first, breaking ties by id, with accurate totals and consistent page boundaries', async () => {
      const totalBefore = (await repository.findPage({ page: 1, pageSize: 1 })).totalItems;
      const created = [newTenant(), newTenant(), newTenant()];
      for (const tenant of created) {
        await repository.save(tenant);
      }
      const createdIds = new Set(created.map((tenant) => tenant.id));

      const wide = await repository.findPage({ page: 1, pageSize: 50 });
      const firstTwo = await repository.findPage({ page: 1, pageSize: 2 });
      const nextTwo = await repository.findPage({ page: 2, pageSize: 2 });
      const wideSnapshots = wide.items.map((tenant) => tenant.toSnapshot());

      expect(wide.totalItems).toBe(totalBefore + 3);
      expect(wideSnapshots).toEqual([...wideSnapshots].sort(newestFirst));
      expect(wideSnapshots.filter((snapshot) => createdIds.has(snapshot.id))).toHaveLength(3);
      expect([...firstTwo.items, ...nextTwo.items].map((tenant) => tenant.id)).toEqual(
        wide.items.slice(0, 4).map((tenant) => tenant.id),
      );
    });
  });
}
