import { TENANT_ID_HEADER } from '../tenancy/tenancy.constants';

function stringProperty(source: unknown, property: string): string | undefined {
  if (typeof source !== 'object' || source === null) {
    return undefined;
  }
  const value: unknown = (source as Record<string, unknown>)[property];
  return typeof value === 'string' ? value : undefined;
}

export function credentialsTracker(request: Record<string, unknown>): string {
  const email = stringProperty(request.body, 'email')?.trim().toLowerCase();
  if (!email) {
    return `ip:${stringProperty(request, 'ip') ?? 'unknown'}`;
  }
  const tenantId = stringProperty(request.headers, TENANT_ID_HEADER)?.trim().toLowerCase() ?? 'no-tenant';
  return `account:${tenantId}:${email}`;
}
