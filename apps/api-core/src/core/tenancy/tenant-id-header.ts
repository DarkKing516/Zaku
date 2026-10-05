import { isUuid } from '@common/utils/uuid';
import { AuthenticatedPrincipal } from '../security/authenticated-principal';
import { TenantHeaderInvalidError, TenantHeaderRequiredError, TenantMismatchError } from './tenancy.errors';

export function resolveRequestedTenantId(headerValue: string | undefined, principal?: AuthenticatedPrincipal): string {
  const headerTenantId = headerValue?.trim().toLowerCase() || undefined;
  if (headerTenantId !== undefined && !isUuid(headerTenantId)) {
    throw new TenantHeaderInvalidError();
  }
  if (principal) {
    if (headerTenantId !== undefined && headerTenantId !== principal.tenantId) {
      throw new TenantMismatchError();
    }
    return principal.tenantId;
  }
  if (headerTenantId === undefined) {
    throw new TenantHeaderRequiredError();
  }
  return headerTenantId;
}
