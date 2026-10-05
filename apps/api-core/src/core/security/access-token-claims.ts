import { isUuid } from '@common/utils/uuid';
import { AuthenticatedPrincipal, PrincipalType } from './authenticated-principal';

export interface AccessTokenClaims {
  readonly sub: string;
  readonly tid: string;
  readonly typ: PrincipalType;
}

const KNOWN_PRINCIPAL_TYPES: readonly string[] = Object.values(PrincipalType);

export function claimsFromPrincipal(principal: AuthenticatedPrincipal): AccessTokenClaims {
  return { sub: principal.subjectId, tid: principal.tenantId, typ: principal.type };
}

export function principalFromClaims(claims: Record<string, unknown>): AuthenticatedPrincipal | null {
  const { sub, tid, typ, exp } = claims;
  if (typeof sub !== 'string' || typeof tid !== 'string' || typeof typ !== 'string' || typeof exp !== 'number') {
    return null;
  }
  if (!isUuid(sub) || !isUuid(tid) || !KNOWN_PRINCIPAL_TYPES.includes(typ)) {
    return null;
  }
  return { subjectId: sub, tenantId: tid.toLowerCase(), type: typ as PrincipalType };
}
