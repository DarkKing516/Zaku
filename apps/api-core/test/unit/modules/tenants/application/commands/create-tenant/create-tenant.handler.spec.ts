import { CreateTenantCommand } from '@modules/tenants/application/commands/create-tenant/create-tenant.command';
import { CreateTenantHandler } from '@modules/tenants/application/commands/create-tenant/create-tenant.handler';
import { TenantDatabaseProvisionerPort } from '@modules/tenants/application/ports/tenant-database-provisioner.port';
import { TenantProvisioningWorkflow } from '@modules/tenants/application/services/tenant-provisioning.workflow';
import { TenantProvisioningFailedError, TenantSlugTakenError } from '@modules/tenants/domain/errors/tenant.errors';
import { TenantStatus } from '@modules/tenants/domain/tenant-status';
import { TenantSlug } from '@modules/tenants/domain/value-objects/tenant-slug';
import { InMemoryTenantDatabaseProvisioner } from '@modules/tenants/infrastructure/mocks/in-memory-tenant-database.provisioner';
import { InMemoryTenantProvisioningLock } from '@modules/tenants/infrastructure/mocks/in-memory-tenant-provisioning.lock';
import { InMemoryTenantRepository } from '@modules/tenants/infrastructure/mocks/in-memory-tenant.repository';

describe('CreateTenantHandler', () => {
  let tenants: InMemoryTenantRepository;
  let provisioner: InMemoryTenantDatabaseProvisioner;
  let handler: CreateTenantHandler;

  function handlerWith(databaseProvisioner: TenantDatabaseProvisionerPort): CreateTenantHandler {
    const workflow = new TenantProvisioningWorkflow(tenants, databaseProvisioner, new InMemoryTenantProvisioningLock());
    return new CreateTenantHandler(tenants, workflow);
  }

  beforeEach(() => {
    tenants = new InMemoryTenantRepository();
    provisioner = new InMemoryTenantDatabaseProvisioner();
    handler = handlerWith(provisioner);
  });

  it('registers the tenant, provisions its database and activates it', async () => {
    const view = await handler.execute(new CreateTenantCommand('Acme', 'Acme Corp'));

    expect(view).toMatchObject({ slug: 'acme', name: 'Acme Corp', status: TenantStatus.Active });
    expect((await tenants.findById(view.id))?.status).toBe(TenantStatus.Active);
    expect(provisioner.isProvisioned(view.id)).toBe(true);
  });

  it('rejects a slug that already belongs to an active tenant', async () => {
    await handler.execute(new CreateTenantCommand('acme', 'Acme Corp'));

    await expect(handler.execute(new CreateTenantCommand('ACME', 'Other'))).rejects.toThrow(TenantSlugTakenError);
  });

  it('keeps the tenant as FAILED when the database cannot be provisioned', async () => {
    provisioner.failNextProvisioning();

    await expect(handler.execute(new CreateTenantCommand('acme', 'Acme Corp'))).rejects.toThrow(
      TenantProvisioningFailedError,
    );

    const stored = await tenants.findBySlug(TenantSlug.create('acme'));
    expect(stored?.status).toBe(TenantStatus.Failed);
    expect(stored?.provisioningError).toContain('Simulated provisioning failure');
  });

  it('resumes the failed tenant when the client retries the same creation', async () => {
    provisioner.failNextProvisioning();
    await expect(handler.execute(new CreateTenantCommand('acme', 'Acme Corp'))).rejects.toThrow();
    const failedTenantId = (await tenants.findBySlug(TenantSlug.create('acme')))?.id;

    const view = await handler.execute(new CreateTenantCommand('acme', 'Acme Corp'));

    expect(view).toMatchObject({ id: failedTenantId, status: TenantStatus.Active });
    expect((await tenants.findPage({ page: 1, pageSize: 10 })).totalItems).toBe(1);
  });

  it('records non-Error failures thrown by an adapter', async () => {
    const handlerWithFlakyAdapter = handlerWith({
      provision: async (): Promise<void> => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error -- simulates a driver that rejects with a non-Error value
        throw 'connection reset';
      },
    });

    await expect(handlerWithFlakyAdapter.execute(new CreateTenantCommand('flaky', 'Flaky'))).rejects.toThrow(
      TenantProvisioningFailedError,
    );
    expect((await tenants.findBySlug(TenantSlug.create('flaky')))?.provisioningError).toBe('connection reset');
  });
});
