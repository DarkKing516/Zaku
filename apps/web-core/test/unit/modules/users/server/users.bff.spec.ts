import { loadUsersPage } from '@/modules/users/server/users.bff';
import { DEMO_TENANT_ID, DEMO_USER } from '@/shared/server/demo-fixtures';
import { serviceContext } from '@test/support/service-context.fixture';

describe('loadUsersPage', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the public users page with the module page size', async () => {
    const result = await loadUsersPage(serviceContext({ tenantId: DEMO_TENANT_ID, accessToken: 'token' }), 2);

    if (!result.ok) {
      throw new Error('expected the page to load');
    }
    expect(result.data.pagination).toMatchObject({ page: 2, pageSize: 10 });
    expect(result.data.items.at(-1)).toEqual({ id: DEMO_USER.id, email: DEMO_USER.email, createdAt: DEMO_USER.createdAt });
    expect(result.data.items[0]).not.toHaveProperty('tenantId');
  });
});
