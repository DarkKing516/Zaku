import { Secret } from '@common/security/secret';
import { VerifyUserCredentialsHandler } from '@modules/users/application/queries/verify-user-credentials/verify-user-credentials.handler';
import { VerifyUserCredentialsQuery } from '@modules/users/application/queries/verify-user-credentials/verify-user-credentials.query';
import { User } from '@modules/users/domain/user';
import { Email } from '@modules/users/domain/value-objects/email';
import { InMemoryUserRepository } from '@modules/users/infrastructure/mocks/in-memory-user.repository';
import { FakePasswordHasher } from '@test/support/fake-password-hasher';

const tenantId = '0a000000-0000-4000-8000-00000000000a';

describe('VerifyUserCredentialsHandler', () => {
  let passwordHasher: FakePasswordHasher;
  let handler: VerifyUserCredentialsHandler;

  beforeEach(async () => {
    const users = new InMemoryUserRepository();
    passwordHasher = new FakePasswordHasher();
    await users.save(tenantId, User.register(Email.create('jane@example.com'), await passwordHasher.hash('right-password')));
    handler = new VerifyUserCredentialsHandler(users, passwordHasher);
  });

  it('returns the user view for valid credentials', async () => {
    const view = await handler.execute(new VerifyUserCredentialsQuery(tenantId, 'JANE@example.com', Secret.of('right-password')));

    expect(view).toMatchObject({ tenantId, email: 'jane@example.com' });
  });

  it('returns null for a wrong password', async () => {
    expect(await handler.execute(new VerifyUserCredentialsQuery(tenantId, 'jane@example.com', Secret.of('wrong-password')))).toBeNull();
  });

  it.each(['nobody@example.com', 'not-an-email'])(
    'still runs a password comparison for unknown account %p to avoid timing leaks',
    async (email) => {
      expect(await handler.execute(new VerifyUserCredentialsQuery(tenantId, email, Secret.of('any-password')))).toBeNull();
      expect(passwordHasher.verifiedAgainstMissingHash).toEqual(['any-password']);
    },
  );
});
