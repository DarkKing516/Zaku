import { Query } from '@nestjs/cqrs';
import { Page, PageRequest } from '@common/pagination/page';
import { TenantView } from '../../views/tenant.view';

export class ListTenantsQuery extends Query<Page<TenantView>> {
  constructor(readonly pageRequest: PageRequest) {
    super();
  }
}
