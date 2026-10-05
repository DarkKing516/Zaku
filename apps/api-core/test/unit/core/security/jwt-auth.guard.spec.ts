import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { RequestContext } from '@core/request-context/request-context';
import {
  AccessTokenExpiredError,
  AccessTokenInvalidError,
  AccessTokenMissingError,
} from '@core/security/access-token.errors';
import { JwtAuthGuard } from '@core/security/jwt-auth.guard';
import { Public } from '@core/security/public.decorator';
import { accessTokenJwtOptions } from '@core/security/security.module';
import { buildAppConfig } from '@test/support/app-config.fixture';
import { fakeRequest, httpExecutionContext } from '@test/support/http-execution-context';

const config = buildAppConfig();
const userId = '1a000000-0000-4000-8000-000000000001';
const tenantId = '0a000000-0000-4000-8000-00000000000a';
const validClaims = { sub: userId, tid: tenantId, typ: 'user' };

class ProtectedController {
  handle(): void {}
}

@Public()
class PublicController {
  handle(): void {}
}

describe('JwtAuthGuard', () => {
  const jwtService = new JwtService(accessTokenJwtOptions(config));
  const guard = new JwtAuthGuard(new Reflector(), jwtService);

  function canActivate(controller: typeof ProtectedController | typeof PublicController, authorization?: string) {
    const request = fakeRequest({ headers: authorization ? { authorization } : {} });
    const context = httpExecutionContext(request, controller, controller.prototype.handle);
    return RequestContext.run({ requestId: 'test' }, async () => {
      const allowed = await guard.canActivate(context);
      return { allowed, principal: RequestContext.current()?.principal };
    });
  }

  it('lets public routes through without a token', async () => {
    await expect(canActivate(PublicController)).resolves.toMatchObject({ allowed: true, principal: undefined });
  });

  it('binds the principal of a valid token to the request context', async () => {
    const token = await jwtService.signAsync(validClaims);

    await expect(canActivate(ProtectedController, `Bearer ${token}`)).resolves.toEqual({
      allowed: true,
      principal: { subjectId: userId, tenantId, type: 'user' },
    });
  });

  it.each([undefined, 'Basic abc', 'Bearer ', 'Bearer'])('denies a missing bearer token (%p)', async (authorization) => {
    await expect(canActivate(ProtectedController, authorization)).rejects.toThrow(AccessTokenMissingError);
  });

  it('denies tokens signed with another secret', async () => {
    const forged = await new JwtService(
      accessTokenJwtOptions(buildAppConfig({ accessToken: { secret: 'another-secret-with-enough-length', expiresInSeconds: 60 } })),
    ).signAsync(validClaims);

    await expect(canActivate(ProtectedController, `Bearer ${forged}`)).rejects.toThrow(AccessTokenInvalidError);
  });

  it('denies unsigned tokens even if their claims look valid', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ ...validClaims, exp: Date.now() / 1000 + 60 })).toString('base64url');

    await expect(canActivate(ProtectedController, `Bearer ${header}.${payload}.`)).rejects.toThrow(
      AccessTokenInvalidError,
    );
  });

  it('denies tokens issued for another audience or issuer', async () => {
    const otherAudience = await jwtService.signAsync(validClaims, { audience: 'another-api' });
    const otherIssuer = await jwtService.signAsync(validClaims, { issuer: 'another-issuer' });

    await expect(canActivate(ProtectedController, `Bearer ${otherAudience}`)).rejects.toThrow(AccessTokenInvalidError);
    await expect(canActivate(ProtectedController, `Bearer ${otherIssuer}`)).rejects.toThrow(AccessTokenInvalidError);
  });

  it('denies tokens without expiration, unknown principal types or missing claims', async () => {
    const neverExpires = await new JwtService({ secret: config.accessToken.secret }).signAsync(validClaims, {
      issuer: 'zaku-api',
      audience: 'zaku-api',
    });
    const unknownType = await jwtService.signAsync({ ...validClaims, typ: 'admin' });
    const missingTenant = await jwtService.signAsync({ sub: userId, typ: 'user' });

    await expect(canActivate(ProtectedController, `Bearer ${neverExpires}`)).rejects.toThrow(AccessTokenInvalidError);
    await expect(canActivate(ProtectedController, `Bearer ${unknownType}`)).rejects.toThrow(AccessTokenInvalidError);
    await expect(canActivate(ProtectedController, `Bearer ${missingTenant}`)).rejects.toThrow(AccessTokenInvalidError);
  });

  it('reports expired tokens distinctly so clients can refresh', async () => {
    const expired = await jwtService.signAsync(validClaims, { expiresIn: -10 });

    await expect(canActivate(ProtectedController, `Bearer ${expired}`)).rejects.toThrow(AccessTokenExpiredError);
  });
});
