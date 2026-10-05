import { PrincipalType } from '@core/security/authenticated-principal';
import { TenantHeaderInvalidError, TenantHeaderRequiredError, TenantMismatchError } from '@core/tenancy/tenancy.errors';
import { resolveRequestedTenantId } from '@core/tenancy/tenant-id-header';

const tenantA = '0a000000-0000-4000-8000-00000000000a';
const tenantB = '0b000000-0000-4000-8000-00000000000b';
const principalOfA = { subjectId: 'user-1', tenantId: tenantA, type: PrincipalType.User };

describe('resolveRequestedTenantId', () => {
  it('uses the normalized header on public routes', () => {
    expect(resolveRequestedTenantId(` ${tenantA.toUpperCase()} `)).toBe(tenantA);
  });

  it('uses the token tenant when authenticated, even without header', () => {
    expect(resolveRequestedTenantId(undefined, principalOfA)).toBe(tenantA);
  });

  it('accepts a header equal to the token tenant regardless of case', () => {
    expect(resolveRequestedTenantId(tenantA.toUpperCase(), principalOfA)).toBe(tenantA);
  });

  it('rejects a header that targets another tenant than the token', () => {
    expect(() => resolveRequestedTenantId(tenantB, principalOfA)).toThrow(TenantMismatchError);
  });

  it('requires the header when there is no token', () => {
    expect(() => resolveRequestedTenantId(undefined)).toThrow(TenantHeaderRequiredError);
    expect(() => resolveRequestedTenantId('   ')).toThrow(TenantHeaderRequiredError);
  });

  it('rejects malformed headers', () => {
    expect(() => resolveRequestedTenantId('acme')).toThrow(TenantHeaderInvalidError);
    expect(() => resolveRequestedTenantId('acme', principalOfA)).toThrow(TenantHeaderInvalidError);
  });
});
