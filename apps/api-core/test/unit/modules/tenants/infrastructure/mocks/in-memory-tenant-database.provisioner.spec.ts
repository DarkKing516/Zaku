import { randomUUID } from 'node:crypto';
import { InMemoryTenantDatabaseProvisioner } from '@modules/tenants/infrastructure/mocks/in-memory-tenant-database.provisioner';
import { describeTenantDatabaseProvisionerContract } from '@test/contracts/tenant-database-provisioner.contract';

describeTenantDatabaseProvisionerContract('InMemoryTenantDatabaseProvisioner', () => ({
  provisioner: new InMemoryTenantDatabaseProvisioner(),
  registerTenantId: async () => randomUUID(),
}));

describe('InMemoryTenantDatabaseProvisioner', () => {
  it('simulates exactly one failure per request so tests can exercise the FAILED path', async () => {
    const provisioner = new InMemoryTenantDatabaseProvisioner();
    const tenantId = randomUUID();
    provisioner.failNextProvisioning();

    await expect(provisioner.provision(tenantId)).rejects.toThrow(/Simulated provisioning failure/);
    await expect(provisioner.provision(tenantId)).resolves.toBeUndefined();
    expect(provisioner.isProvisioned(tenantId)).toBe(true);
  });
});
