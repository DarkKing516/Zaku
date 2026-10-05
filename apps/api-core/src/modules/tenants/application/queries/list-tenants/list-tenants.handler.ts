import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Page } from '@common/pagination/page';
import { TENANT_REPOSITORY, TenantRepositoryPort } from '../../ports/tenant.repository.port';
import { TenantView, toTenantView } from '../../views/tenant.view';
import { ListTenantsQuery } from './list-tenants.query';

@QueryHandler(ListTenantsQuery)
export class ListTenantsHandler implements IQueryHandler<ListTenantsQuery> {
  constructor(@Inject(TENANT_REPOSITORY) private readonly tenants: TenantRepositoryPort) {}

  async execute(query: ListTenantsQuery): Promise<Page<TenantView>> {
    const page = await this.tenants.findPage(query.pageRequest);
    return page.map(toTenantView);
  }
}
