export const TENANT_DATABASE_PROVISIONER = Symbol('TENANT_DATABASE_PROVISIONER');

export interface TenantDatabaseProvisionerPort {
  provision(tenantId: string): Promise<void>;
}
