import { CommandBus, CqrsModule, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { Secret } from '@common/security/secret';
import { LoginUserCommand } from '@modules/user-auth/application/commands/login-user/login-user.command';
import { LoginUserHandler } from '@modules/user-auth/application/commands/login-user/login-user.handler';
import { InvalidCredentialsError } from '@modules/user-auth/application/errors/user-auth.errors';
import {
  ACCESS_TOKEN_ISSUER,
  AccessTokenIssuerPort,
  AccessTokenSubject,
} from '@modules/user-auth/application/ports/access-token-issuer.port';
import { UserView, VerifyUserCredentialsQuery } from '@modules/users';

const tenantId = '0a000000-0000-4000-8000-00000000000a';
const jane: UserView = {
  id: '1a000000-0000-4000-8000-000000000001',
  tenantId,
  email: 'jane@example.com',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

@QueryHandler(VerifyUserCredentialsQuery)
class StubVerifyUserCredentialsHandler implements IQueryHandler<VerifyUserCredentialsQuery> {
  async execute(query: VerifyUserCredentialsQuery): Promise<UserView | null> {
    const isJane = query.tenantId === tenantId && query.email === jane.email;
    return isJane && query.password.reveal() === 'right-password' ? jane : null;
  }
}

class RecordingAccessTokenIssuer implements AccessTokenIssuerPort {
  readonly subjects: AccessTokenSubject[] = [];

  async issue(subject: AccessTokenSubject) {
    this.subjects.push(subject);
    return { accessToken: `token-for-${subject.userId}`, tokenType: 'Bearer' as const, expiresInSeconds: 60 };
  }
}

describe('LoginUserHandler (through the CQRS buses)', () => {
  let moduleRef: TestingModule;
  let commandBus: CommandBus;
  let tokenIssuer: RecordingAccessTokenIssuer;

  beforeEach(async () => {
    tokenIssuer = new RecordingAccessTokenIssuer();
    moduleRef = await Test.createTestingModule({
      imports: [CqrsModule.forRoot()],
      providers: [
        LoginUserHandler,
        StubVerifyUserCredentialsHandler,
        { provide: ACCESS_TOKEN_ISSUER, useValue: tokenIssuer },
      ],
    }).compile();
    await moduleRef.init();
    commandBus = moduleRef.get(CommandBus);
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('asks the users module to verify credentials and issues a token for that user and tenant', async () => {
    const session = await commandBus.execute(
      new LoginUserCommand(tenantId, 'jane@example.com', Secret.of('right-password')),
    );

    expect(session).toMatchObject({ accessToken: `token-for-${jane.id}`, user: jane });
    expect(tokenIssuer.subjects).toEqual([{ userId: jane.id, tenantId }]);
  });

  it('rejects invalid credentials without issuing a token', async () => {
    await expect(
      commandBus.execute(new LoginUserCommand(tenantId, 'jane@example.com', Secret.of('wrong-password'))),
    ).rejects.toThrow(InvalidCredentialsError);
    expect(tokenIssuer.subjects).toEqual([]);
  });
});
