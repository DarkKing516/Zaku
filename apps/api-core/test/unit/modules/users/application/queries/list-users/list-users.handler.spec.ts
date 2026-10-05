import { ListUsersHandler } from '@modules/users/application/queries/list-users/list-users.handler';
import { ListUsersQuery } from '@modules/users/application/queries/list-users/list-users.query';
import { User } from '@modules/users/domain/user';
import { Email } from '@modules/users/domain/value-objects/email';
import { InMemoryUserRepository } from '@modules/users/infrastructure/mocks/in-memory-user.repository';

const tenantA = '0a000000-0000-4000-8000-00000000000a';
const tenantB = '0b000000-0000-4000-8000-00000000000b';

describe('ListUsersHandler', () => {
  it('paginates only the users of the requested tenant', async () => {
    const users = new InMemoryUserRepository();
    for (const email of ['a1@example.com', 'a2@example.com', 'a3@example.com']) {
      await users.save(tenantA, User.register(Email.create(email), 'hash'));
    }
    await users.save(tenantB, User.register(Email.create('b1@example.com'), 'hash'));

    const page = await new ListUsersHandler(users).execute(new ListUsersQuery(tenantA, { page: 1, pageSize: 2 }));

    expect(page.items).toHaveLength(2);
    expect(page.items.every((view) => view.tenantId === tenantA)).toBe(true);
    expect(page).toMatchObject({ totalItems: 3, totalPages: 2 });
  });
});
