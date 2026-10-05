import { Query } from '@nestjs/cqrs';
import { Secret } from '@common/security/secret';
import { UserView } from '../../views/user.view';

export class VerifyUserCredentialsQuery extends Query<UserView | null> {
  constructor(
    readonly tenantId: string,
    readonly email: string,
    readonly password: Secret,
  ) {
    super();
  }
}
