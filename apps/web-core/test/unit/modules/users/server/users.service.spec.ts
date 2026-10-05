import { UsersService } from '@/modules/users/server/users.service';
import { DEMO_TENANT_ID } from '@/shared/server/demo-fixtures';
import { serviceContext } from '@test/support/service-context.fixture';

describe('UsersService', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('lists the users of the session tenant from the active branch', async () => {
    const result = await UsersService.listPage(serviceContext({ tenantId: DEMO_TENANT_ID, accessToken: 'token' }), 1, 5);

    expect(result).toMatchObject({ ok: true, data: { pagination: { page: 1, pageSize: 5 } } });
  });
});
