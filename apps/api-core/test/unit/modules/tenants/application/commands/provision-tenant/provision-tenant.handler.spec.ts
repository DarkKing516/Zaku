import { ProvisionTenantCommand } from '@modules/tenants/application/commands/provision-tenant/provision-tenant.command';
import { ProvisionTenantHandler } from '@modules/tenants/application/commands/provision-tenant/provision-tenant.handler';
import { TenantDatabaseProvisionerPort } from '@modules/tenants/application/ports/tenant-database-provisioner.port';
import { TenantProvisioningWorkflow } from '@modules/tenants/application/services/tenant-provisioning.workflow';
import {
  TenantNotFoundError,
  TenantNotProvisionableError,
  TenantProvisioningInProgressError,
} from '@modules/tenants/domain/errors/tenant.errors';
import { Tenant } from '@modules/tenants/domain/tenant';
import { TenantStatus } from '@modules/tenants/domain/tenant-status';
import { TenantName } from '@modules/tenants/domain/value-objects/tenant-name';
import { TenantSlug } from '@modules/tenants/domain/value-objects/tenant-slug';
import { InMemoryTenantDatabaseProvisioner } from '@modules/tenants/infrastructure/mocks/in-memory-tenant-database.provisioner';
import { InMemoryTenantProvisioningLock } from '@modules/tenants/infrastructure/mocks/in-memory-tenant-provisioning.lock';
import { InMemoryTenantRepository } from '@modules/tenants/infrastructure/mocks/in-memory-tenant.repository';

describe('ProvisionTenantHandler', () => {
  let tenants: InMemoryTenantRepository;
  let lock: InMemoryTenantProvisioningLock;
  let provisioner: InMemoryTenantDatabaseProvisioner;

  function handlerWith(databaseProvisioner: TenantDatabaseProvisionerPort): ProvisionTenantHandler {
    return new ProvisionTenantHandler(new TenantProvisioningWorkflow(tenants, databaseProvisioner, lock));
  }

  async function storeFailedTenant(): Promise<Tenant> {
    const tenant = Tenant.register(TenantSlug.create('acme'), TenantName.create('Acme Corp'));
    tenant.failProvisioning('boom');
    await tenants.save(tenant);
    return tenant;
  }

  beforeEach(() => {
    tenants = new InMemoryTenantRepository();
    lock = new InMemoryTenantProvisioningLock();
    provisioner = new InMemoryTenantDatabaseProvisioner();
  });

  it('retries a FAILED tenant until it is ACTIVE', async () => {
    const tenant = await storeFailedTenant();

    const view = await handlerWith(provisioner).execute(new ProvisionTenantCommand(tenant.id));

    expect(view.status).toBe(TenantStatus.Active);
    expect(provisioner.isProvisioned(tenant.id)).toBe(true);
  });

  it('fails for an unknown tenant', async () => {
    await expect(
      handlerWith(provisioner).execute(new ProvisionTenantCommand('00000000-0000-4000-8000-000000000099')),
    ).rejects.toThrow(TenantNotFoundError);
  });

  it('refuses to provision an already ACTIVE tenant', async () => {
    const tenant = await storeFailedTenant();
    const handler = handlerWith(provisioner);
    await handler.execute(new ProvisionTenantCommand(tenant.id));

    await expect(handler.execute(new ProvisionTenantCommand(tenant.id))).rejects.toThrow(TenantNotProvisionableError);
  });

  it('rejects a concurrent retry without touching the state saved by the running one', async () => {
    const tenant = await storeFailedTenant();
    let finishFirstProvisioning: () => void = () => undefined;
    const slowProvisioner: TenantDatabaseProvisionerPort = {
      provision: () => new Promise<void>((resolve) => (finishFirstProvisioning = resolve)),
    };
    const handler = handlerWith(slowProvisioner);

    const firstRun = handler.execute(new ProvisionTenantCommand(tenant.id));
    await new Promise((resolve) => setImmediate(resolve));
    await expect(handler.execute(new ProvisionTenantCommand(tenant.id))).rejects.toThrow(
      TenantProvisioningInProgressError,
    );
    finishFirstProvisioning();

    await expect(firstRun).resolves.toMatchObject({ status: TenantStatus.Active });
    expect((await tenants.findById(tenant.id))?.status).toBe(TenantStatus.Active);
  });

  it('reads the latest state inside the lock, so a retry after a finished run is rejected', async () => {
    const tenant = await storeFailedTenant();
    const handler = handlerWith(provisioner);
    const staleRetry = new ProvisionTenantCommand(tenant.id);

    await handler.execute(new ProvisionTenantCommand(tenant.id));

    await expect(handler.execute(staleRetry)).rejects.toThrow(TenantNotProvisionableError);
    expect((await tenants.findById(tenant.id))?.status).toBe(TenantStatus.Active);
  });
});
