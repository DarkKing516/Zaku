import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { TenantNotFoundError } from '../../../domain/errors/tenant.errors';
import { TENANT_REPOSITORY, TenantRepositoryPort } from '../../ports/tenant.repository.port';
import { TenantView, toTenantView } from '../../views/tenant.view';
import { GetTenantByIdQuery } from './get-tenant-by-id.query';

@QueryHandler(GetTenantByIdQuery)
export class GetTenantByIdHandler implements IQueryHandler<GetTenantByIdQuery> {
  constructor(@Inject(TENANT_REPOSITORY) private readonly tenants: TenantRepositoryPort) {}

  async execute(query: GetTenantByIdQuery): Promise<TenantView> {
    const tenant = await this.tenants.findById(query.tenantId);
    if (!tenant) {
      throw new TenantNotFoundError(query.tenantId);
    }
    return toTenantView(tenant);
  }
}
