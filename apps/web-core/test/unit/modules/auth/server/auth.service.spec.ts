import { AuthService } from '@/modules/auth/server/auth.service';
import { DEMO_TENANT_ID, DEMO_USER } from '@/shared/server/demo-fixtures';
import { serviceContext } from '@test/support/service-context.fixture';

describe('AuthService', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs in against the active branch (mock by default) without touching the network', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch');

    const result = await AuthService.login(serviceContext(), { tenantId: DEMO_TENANT_ID, email: DEMO_USER.email, password: DEMO_USER.password });

    expect(result.ok).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
