import { authMock } from '@/modules/auth/server/auth.mock';
import { DEMO_TENANT_ID, DEMO_USER } from '@/shared/server/demo-fixtures';

describe('authMock', () => {
  it('signs in the demo user with an api-core shaped response', () => {
    const result = authMock.login(DEMO_TENANT_ID, { email: DEMO_USER.email, password: DEMO_USER.password });

    expect(result).toMatchObject({
      ok: true,
      data: { tokenType: 'Bearer', expiresIn: 3600, user: { id: DEMO_USER.id, tenantId: DEMO_TENANT_ID, email: DEMO_USER.email } },
    });
  });

  it('answers with the same error codes as api-core', () => {
    expect(authMock.login('00000000-0000-4000-8000-0000000000ff', { email: DEMO_USER.email, password: DEMO_USER.password })).toMatchObject({
      ok: false,
      error: { status: 403, code: 'TENANT_UNAVAILABLE' },
    });
    expect(authMock.login(DEMO_TENANT_ID, { email: DEMO_USER.email, password: 'wrong' })).toMatchObject({
      ok: false,
      error: { status: 401, code: 'USER_AUTH_INVALID_CREDENTIALS' },
    });
  });
});
