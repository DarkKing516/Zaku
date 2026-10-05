import { Command } from '@nestjs/cqrs';
import { Secret } from '@common/security/secret';
import { UserSessionView } from '../../views/user-session.view';

export class LoginUserCommand extends Command<UserSessionView> {
  constructor(
    readonly tenantId: string,
    readonly email: string,
    readonly password: Secret,
  ) {
    super();
  }
}
