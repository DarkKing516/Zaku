import { Secret } from '@common/security/secret';
import { CreateUserCommand } from '@modules/users/application/commands/create-user/create-user.command';
import { CreateUserHandler } from '@modules/users/application/commands/create-user/create-user.handler';
import {
  UserAlreadyExistsError,
  UserEmailInvalidError,
  UserPasswordPolicyError,
} from '@modules/users/domain/errors/user.errors';
import { Email } from '@modules/users/domain/value-objects/email';
import { InMemoryUserRepository } from '@modules/users/infrastructure/mocks/in-memory-user.repository';
import { FakePasswordHasher } from '@test/support/fake-password-hasher';

const tenantId = '0a000000-0000-4000-8000-00000000000a';

describe('CreateUserHandler', () => {
  let users: InMemoryUserRepository;
  let handler: CreateUserHandler;

  beforeEach(() => {
    users = new InMemoryUserRepository();
    handler = new CreateUserHandler(users, new FakePasswordHasher());
  });

  it('stores the user with a hashed password and returns a view without secrets', async () => {
    const view = await handler.execute(new CreateUserCommand(tenantId, 'Jane@Example.com', Secret.of('secure-password')));

    const stored = await users.findById(tenantId, view.id);
    expect(view).toMatchObject({ tenantId, email: 'jane@example.com' });
    expect(view).not.toHaveProperty('passwordHash');
    expect(stored?.passwordHash).toBe('hashed:secure-password');
  });

  it('rejects an email already registered in the same tenant', async () => {
    await handler.execute(new CreateUserCommand(tenantId, 'jane@example.com', Secret.of('secure-password')));

    await expect(handler.execute(new CreateUserCommand(tenantId, 'JANE@example.com', Secret.of('other-password')))).rejects.toThrow(
      UserAlreadyExistsError,
    );
  });

  it('enforces domain rules even when called without HTTP validation', async () => {
    await expect(handler.execute(new CreateUserCommand(tenantId, 'not-an-email', Secret.of('secure-password')))).rejects.toThrow(
      UserEmailInvalidError,
    );
    await expect(handler.execute(new CreateUserCommand(tenantId, 'jane@example.com', Secret.of('short')))).rejects.toThrow(
      UserPasswordPolicyError,
    );
    expect(await users.findByEmail(tenantId, Email.create('jane@example.com'))).toBeNull();
  });
});
