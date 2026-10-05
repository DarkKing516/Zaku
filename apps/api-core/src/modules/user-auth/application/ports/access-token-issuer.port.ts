export const ACCESS_TOKEN_ISSUER = Symbol('ACCESS_TOKEN_ISSUER');

export interface AccessTokenSubject {
  readonly userId: string;
  readonly tenantId: string;
}

export interface IssuedAccessToken {
  readonly accessToken: string;
  readonly tokenType: 'Bearer';
  readonly expiresInSeconds: number;
}

export interface AccessTokenIssuerPort {
  issue(subject: AccessTokenSubject): Promise<IssuedAccessToken>;
}
