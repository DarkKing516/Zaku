import { JwtService } from '@nestjs/jwt';
import { principalFromClaims } from '@core/security/access-token-claims';
import { ACCESS_TOKEN_AUDIENCE, ACCESS_TOKEN_ISSUER } from '@core/security/access-token.constants';
import { accessTokenJwtOptions } from '@core/security/security.module';
import { JwtAccessTokenIssuer } from '@modules/user-auth/infrastructure/adapters/jwt-access-token.issuer';
import { buildAppConfig } from '@test/support/app-config.fixture';

const userId = '1a000000-0000-4000-8000-000000000001';
const tenantId = '0a000000-0000-4000-8000-00000000000a';

describe('JwtAccessTokenIssuer', () => {
  it('issues an expiring token whose claims are understood by the core security guard', async () => {
    const config = buildAppConfig();
    const jwtService = new JwtService(accessTokenJwtOptions(config));
    const issuer = new JwtAccessTokenIssuer(jwtService, config);

    const issued = await issuer.issue({ userId, tenantId });
    const claims = await jwtService.verifyAsync<Record<string, unknown>>(issued.accessToken, {
      issuer: ACCESS_TOKEN_ISSUER,
      audience: ACCESS_TOKEN_AUDIENCE,
    });

    expect(issued).toMatchObject({ tokenType: 'Bearer', expiresInSeconds: 3600 });
    expect(claims.exp).toEqual(expect.any(Number));
    expect(principalFromClaims(claims)).toEqual({ subjectId: userId, tenantId, type: 'user' });
  });
});
