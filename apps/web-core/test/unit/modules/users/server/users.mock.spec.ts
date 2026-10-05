import type { UserResponse } from '@/modules/users/server/contracts';
import { usersMock } from '@/modules/users/server/users.mock';
import { DEMO_TENANT_ID } from '@/shared/server/demo-fixtures';

describe('usersMock', () => {
  it('pages the tenant users newest first with api-core pagination metadata', () => {
    const first = usersMock.listPage(DEMO_TENANT_ID, 1, 10);
    const second = usersMock.listPage(DEMO_TENANT_ID, 2, 10);

    if (!first.ok || !second.ok) {
      throw new Error('expected both pages to load');
    }
    expect(first.data.pagination).toEqual({ page: 1, pageSize: 10, totalItems: 13, totalPages: 2 });
    expect(first.data.items).toHaveLength(10);
    expect(second.data.items).toHaveLength(3);
    const createdAt = [...first.data.items, ...second.data.items].map((user) => user.createdAt);
    expect(createdAt).toEqual([...createdAt].sort().reverse());
  });

  it('breaks ties on the creation date by id, like api-core', () => {
    const tenantId = '00000000-0000-4000-8000-0000000000aa';
    const sameMoment = '2026-03-01T00:00:00.000Z';
    const store = globalThis as unknown as { __zakuUsersMock: UserResponse[] };
    store.__zakuUsersMock.push(
      { id: 'b-user', tenantId, email: 'b@zaku.dev', createdAt: sameMoment, updatedAt: sameMoment },
      { id: 'a-user', tenantId, email: 'a@zaku.dev', createdAt: sameMoment, updatedAt: sameMoment },
    );

    const page = usersMock.listPage(tenantId, 1, 10);

    expect(page.ok && page.data.items.map((user) => user.id)).toEqual(['a-user', 'b-user']);
  });

  it('isolates tenants and requires one', () => {
    expect(usersMock.listPage('00000000-0000-4000-8000-0000000000ff', 1, 10)).toMatchObject({ ok: true, data: { items: [], pagination: { totalItems: 0 } } });
    expect(usersMock.listPage(undefined, 1, 10)).toMatchObject({ ok: false, error: { status: 401 } });
  });
});
