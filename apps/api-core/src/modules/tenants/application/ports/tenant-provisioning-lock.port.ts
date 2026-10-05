export const TENANT_PROVISIONING_LOCK = Symbol('TENANT_PROVISIONING_LOCK');

export interface TenantProvisioningLockPort {
  runExclusively<TResult>(tenantId: string, work: () => Promise<TResult>): Promise<TResult>;
}
