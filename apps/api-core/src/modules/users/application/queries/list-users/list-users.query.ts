import { Query } from '@nestjs/cqrs';
import { Page, PageRequest } from '@common/pagination/page';
import { UserView } from '../../views/user.view';

export class ListUsersQuery extends Query<Page<UserView>> {
  constructor(
    readonly tenantId: string,
    readonly pageRequest: PageRequest,
  ) {
    super();
  }
}
