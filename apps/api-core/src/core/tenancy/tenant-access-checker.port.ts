export const TENANT_ACCESS_CHECKER = Symbol('TENANT_ACCESS_CHECKER');

export interface TenantAccessCheckerPort {
  isTenantActive(tenantId: string): Promise<boolean>;
}
