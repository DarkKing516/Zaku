import { GetUserByIdHandler } from '@modules/users/application/queries/get-user-by-id/get-user-by-id.handler';
import { GetUserByIdQuery } from '@modules/users/application/queries/get-user-by-id/get-user-by-id.query';
import { UserNotFoundError } from '@modules/users/domain/errors/user.errors';
import { User } from '@modules/users/domain/user';
import { Email } from '@modules/users/domain/value-objects/email';
import { InMemoryUserRepository } from '@modules/users/infrastructure/mocks/in-memory-user.repository';

const tenantA = '0a000000-0000-4000-8000-00000000000a';
const tenantB = '0b000000-0000-4000-8000-00000000000b';

describe('GetUserByIdHandler', () => {
  it('finds a user inside its tenant', async () => {
    const users = new InMemoryUserRepository();
    const user = User.register(Email.create('jane@example.com'), 'hash');
    await users.save(tenantA, user);

    const view = await new GetUserByIdHandler(users).execute(new GetUserByIdQuery(tenantA, user.id));

    expect(view).toMatchObject({ id: user.id, tenantId: tenantA, email: 'jane@example.com' });
  });

  it('does not find the same id from another tenant', async () => {
    const users = new InMemoryUserRepository();
    const user = User.register(Email.create('jane@example.com'), 'hash');
    await users.save(tenantA, user);

    await expect(new GetUserByIdHandler(users).execute(new GetUserByIdQuery(tenantB, user.id))).rejects.toThrow(
      UserNotFoundError,
    );
  });
});
