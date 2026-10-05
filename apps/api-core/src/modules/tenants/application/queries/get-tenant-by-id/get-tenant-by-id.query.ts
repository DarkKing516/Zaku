import { Query } from '@nestjs/cqrs';
import { TenantView } from '../../views/tenant.view';

export class GetTenantByIdQuery extends Query<TenantView> {
  constructor(readonly tenantId: string) {
    super();
  }
}
