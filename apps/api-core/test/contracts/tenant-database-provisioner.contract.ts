import { TenantDatabaseProvisionerPort } from '@modules/tenants/application/ports/tenant-database-provisioner.port';

export interface TenantDatabaseProvisionerContractContext {
  readonly provisioner: TenantDatabaseProvisionerPort;
  registerTenantId(): Promise<string>;
}

export function describeTenantDatabaseProvisionerContract(
  adapterName: string,
  createContext: () => TenantDatabaseProvisionerContractContext | Promise<TenantDatabaseProvisionerContractContext>,
): void {
  describe(`${adapterName} honours the TenantDatabaseProvisionerPort contract`, () => {
    let context: TenantDatabaseProvisionerContractContext;

    beforeAll(async () => {
      context = await createContext();
    });

    it('provisions the database of a new tenant', async () => {
      const tenantId = await context.registerTenantId();

      await expect(context.provisioner.provision(tenantId)).resolves.toBeUndefined();
    });

    it('is idempotent, so a retry after a partial failure completes the work', async () => {
      const tenantId = await context.registerTenantId();
      await context.provisioner.provision(tenantId);

      await expect(context.provisioner.provision(tenantId)).resolves.toBeUndefined();
    });
  });
}
