export const TenantStatus = {
  Provisioning: 'PROVISIONING',
  Active: 'ACTIVE',
  Failed: 'FAILED',
  Suspended: 'SUSPENDED',
} as const;

export type TenantStatus = (typeof TenantStatus)[keyof typeof TenantStatus];

const TENANT_STATUSES: readonly string[] = Object.values(TenantStatus);

export function isTenantStatus(value: string): value is TenantStatus {
  return TENANT_STATUSES.includes(value);
}
