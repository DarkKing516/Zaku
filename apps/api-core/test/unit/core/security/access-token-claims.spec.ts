import { claimsFromPrincipal, principalFromClaims } from '@core/security/access-token-claims';
import { PrincipalType } from '@core/security/authenticated-principal';

const userId = '1a000000-0000-4000-8000-000000000001';
const tenantId = '0a000000-0000-4000-8000-00000000000a';

describe('access token claims', () => {
  it('round-trips a principal through compact JWT claims', () => {
    const principal = { subjectId: userId, tenantId, type: PrincipalType.User };

    expect(claimsFromPrincipal(principal)).toEqual({ sub: userId, tid: tenantId, typ: 'user' });
    expect(principalFromClaims({ ...claimsFromPrincipal(principal), iat: 1, exp: 2 })).toEqual(principal);
  });

  it.each([
    {},
    { sub: userId, tid: tenantId, exp: 2 },
    { sub: userId, tid: tenantId, typ: 'user' },
    { sub: userId, tid: 1, typ: 'user', exp: 2 },
    { sub: userId, tid: tenantId, typ: 'root', exp: 2 },
    { sub: 'not-a-uuid', tid: tenantId, typ: 'user', exp: 2 },
    { sub: userId, tid: 'acme', typ: 'user', exp: 2 },
  ])('rejects malformed claims %p', (claims) => {
    expect(principalFromClaims(claims)).toBeNull();
  });
});
