const TENANT_DATABASE_PREFIX = 'zaku_t_';
const TENANT_DATABASE_NAME_PATTERN = /^zaku_t_[0-9a-f]{32}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function tenantDatabaseNameFor(tenantId: string): string {
  if (!UUID_PATTERN.test(tenantId)) {
    throw new Error(`Cannot derive a tenant database name from non-UUID tenant id "${tenantId}"`);
  }
  return `${TENANT_DATABASE_PREFIX}${tenantId.replace(/-/g, '').toLowerCase()}`;
}

export function isTenantDatabaseName(databaseName: string): boolean {
  return TENANT_DATABASE_NAME_PATTERN.test(databaseName);
}
