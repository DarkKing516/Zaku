import 'server-only';
import { publicBff } from '@/shared/server/bff/define-bff';
import { DEMO_TENANT_ID, DEMO_USER } from '@/shared/server/demo-fixtures';
import { isLocalEnvironment } from '@/shared/server/env';
import { ok, type Result } from '@/shared/server/http';
import { loginSchema } from '../schemas';
import type { DemoCredentials, SessionUser } from '../types';
import { toEstablishedSession } from './auth.mappers';
import { AuthService } from './auth.service';
import { rememberTenant } from './remembered-tenant';

export const login = publicBff({ body: loginSchema }, async ({ body, session, service }): Promise<Result<SessionUser>> => {
  const result = await AuthService.login(service, body);
  if (!result.ok) {
    return result;
  }

  const established = toEstablishedSession(result.data);
  session.user = established.user;
  session.accessToken = established.accessToken;
  session.expiresAt = established.expiresAt;
  await session.save();
  await rememberTenant(body.tenantId);

  return ok(established.user);
});

export const logout = publicBff({}, async ({ session }) => {
  session.destroy();
  return ok({ loggedOut: true });
});

export function demoCredentialsForLocalEnvironment(): DemoCredentials | undefined {
  return isLocalEnvironment() ? { tenantId: DEMO_TENANT_ID, email: DEMO_USER.email, password: DEMO_USER.password } : undefined;
}
