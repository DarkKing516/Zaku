import { Query } from '@nestjs/cqrs';
import { UserView } from '../../views/user.view';

export class GetUserByIdQuery extends Query<UserView> {
  constructor(
    readonly tenantId: string,
    readonly userId: string,
  ) {
    super();
  }
}
