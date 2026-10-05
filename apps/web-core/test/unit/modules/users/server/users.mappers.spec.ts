import { toUserSummary, toUsersPage } from '@/modules/users/server/users.mappers';

const user = { id: 'user-1', tenantId: 'tenant-1', email: 'demo@zaku.dev', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' };

describe('users mappers', () => {
  it('exposes only what the screen shows', () => {
    expect(toUserSummary(user)).toEqual({ id: 'user-1', email: 'demo@zaku.dev', createdAt: '2026-01-01T00:00:00.000Z' });
  });

  it('keeps the pagination of the page', () => {
    const pagination = { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 };

    expect(toUsersPage({ items: [user], pagination })).toEqual({ items: [toUserSummary(user)], pagination });
  });
});
