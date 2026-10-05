import 'server-only';
import { DEMO_TENANT_ID, DEMO_USER } from '@/shared/server/demo-fixtures';
import { fail, ok, type Result } from '@/shared/server/http';
import type { LoginRequest, LoginResponse } from './contracts';

const MOCK_TOKEN_LIFETIME_SECONDS = 3600;

export const authMock = {
  login(tenantId: string, request: LoginRequest): Result<LoginResponse> {
    if (tenantId !== DEMO_TENANT_ID) {
      return fail(403, 'El tenant no existe o no está disponible', 'TENANT_UNAVAILABLE');
    }
    if (request.email !== DEMO_USER.email || request.password !== DEMO_USER.password) {
      return fail(401, 'Correo o contraseña incorrectos', 'USER_AUTH_INVALID_CREDENTIALS');
    }
    return ok({
      accessToken: `mock-access-token.${DEMO_USER.id}`,
      tokenType: 'Bearer',
      expiresIn: MOCK_TOKEN_LIFETIME_SECONDS,
      user: { id: DEMO_USER.id, tenantId, email: DEMO_USER.email, createdAt: DEMO_USER.createdAt, updatedAt: DEMO_USER.createdAt },
    });
  },
};
