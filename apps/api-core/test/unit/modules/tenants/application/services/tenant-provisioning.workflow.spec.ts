import { TenantProvisioningWorkflow } from '@modules/tenants/application/services/tenant-provisioning.workflow';
import {
  TenantNotFoundError,
  TenantNotProvisionableError,
  TenantProvisioningFailedError,
} from '@modules/tenants/domain/errors/tenant.errors';
import { Tenant } from '@modules/tenants/domain/tenant';
import { TenantStatus } from '@modules/tenants/domain/tenant-status';
import { TenantName } from '@modules/tenants/domain/value-objects/tenant-name';
import { TenantSlug } from '@modules/tenants/domain/value-objects/tenant-slug';
import { InMemoryTenantDatabaseProvisioner } from '@modules/tenants/infrastructure/mocks/in-memory-tenant-database.provisioner';
import { InMemoryTenantProvisioningLock } from '@modules/tenants/infrastructure/mocks/in-memory-tenant-provisioning.lock';
import { InMemoryTenantRepository } from '@modules/tenants/infrastructure/mocks/in-memory-tenant.repository';

describe('TenantProvisioningWorkflow', () => {
  let tenants: InMemoryTenantRepository;
  let provisioner: InMemoryTenantDatabaseProvisioner;
  let workflow: TenantProvisioningWorkflow;

  beforeEach(() => {
    tenants = new InMemoryTenantRepository();
    provisioner = new InMemoryTenantDatabaseProvisioner();
    workflow = new TenantProvisioningWorkflow(tenants, provisioner, new InMemoryTenantProvisioningLock());
  });

  function newTenant(): Tenant {
    return Tenant.register(TenantSlug.create('acme'), TenantName.create('Acme Corp'));
  }

  it('stores, provisions and activates a new tenant', async () => {
    const tenant = newTenant();

    const view = await workflow.provisionNewTenant(tenant);

    expect(view.status).toBe(TenantStatus.Active);
    expect(provisioner.isProvisioned(tenant.id)).toBe(true);
    expect((await tenants.findById(tenant.id))?.status).toBe(TenantStatus.Active);
  });

  it('persists FAILED with the reason when provisioning breaks', async () => {
    const tenant = newTenant();
    provisioner.failNextProvisioning();

    await expect(workflow.provisionNewTenant(tenant)).rejects.toThrow(TenantProvisioningFailedError);

    const stored = await tenants.findById(tenant.id);
    expect(stored?.status).toBe(TenantStatus.Failed);
    expect(stored?.provisioningError).toMatch(/Simulated provisioning failure/);
  });

  it('retries from the stored state, not from a stale copy held by the caller', async () => {
    const tenant = newTenant();
    provisioner.failNextProvisioning();
    await expect(workflow.provisionNewTenant(tenant)).rejects.toThrow();

    await workflow.retryProvisioning(tenant.id);

    await expect(workflow.retryProvisioning(tenant.id)).rejects.toThrow(TenantNotProvisionableError);
  });

  it('reports unknown tenants on retry', async () => {
    await expect(workflow.retryProvisioning('00000000-0000-4000-8000-000000000099')).rejects.toThrow(
      TenantNotFoundError,
    );
  });
});
