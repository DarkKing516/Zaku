import { Command } from '@nestjs/cqrs';
import { Secret } from '@common/security/secret';
import { UserView } from '../../views/user.view';

export class CreateUserCommand extends Command<UserView> {
  constructor(
    readonly tenantId: string,
    readonly email: string,
    readonly password: Secret,
  ) {
    super();
  }
}
