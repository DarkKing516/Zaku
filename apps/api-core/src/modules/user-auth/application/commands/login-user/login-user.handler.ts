import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { VerifyUserCredentialsQuery } from '@modules/users';
import { InvalidCredentialsError } from '../../errors/user-auth.errors';
import { ACCESS_TOKEN_ISSUER, AccessTokenIssuerPort } from '../../ports/access-token-issuer.port';
import { UserSessionView } from '../../views/user-session.view';
import { LoginUserCommand } from './login-user.command';

@CommandHandler(LoginUserCommand)
export class LoginUserHandler implements ICommandHandler<LoginUserCommand> {
  constructor(
    private readonly queryBus: QueryBus,
    @Inject(ACCESS_TOKEN_ISSUER) private readonly accessTokenIssuer: AccessTokenIssuerPort,
  ) {}

  async execute(command: LoginUserCommand): Promise<UserSessionView> {
    const user = await this.queryBus.execute(
      new VerifyUserCredentialsQuery(command.tenantId, command.email, command.password),
    );
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const token = await this.accessTokenIssuer.issue({ userId: user.id, tenantId: user.tenantId });
    return { ...token, user };
  }
}
