export const PrincipalType = {
  User: 'user',
} as const;

export type PrincipalType = (typeof PrincipalType)[keyof typeof PrincipalType];

export interface AuthenticatedPrincipal {
  readonly subjectId: string;
  readonly tenantId: string;
  readonly type: PrincipalType;
}
