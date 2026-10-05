import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Page, PageRequest } from '@common/pagination/page';
import { ControlPlaneDatabase } from '@core/database/control-plane-database';
import { isUniqueViolation } from '@core/database/postgres-errors';
import { TenantRepositoryPort } from '../../../application/ports/tenant.repository.port';
import { TenantSlugTakenError } from '../../../domain/errors/tenant.errors';
import { Tenant } from '../../../domain/tenant';
import { TenantSlug } from '../../../domain/value-objects/tenant-slug';
import { toTenantDomain, toTenantOrmEntity } from './tenant-orm.mapper';
import { TENANT_SLUG_UNIQUE_CONSTRAINT, TenantOrmEntity } from './tenant.orm-entity';

@Injectable()
export class TypeOrmTenantRepository implements TenantRepositoryPort {
  constructor(private readonly controlPlaneDatabase: ControlPlaneDatabase) {}

  async save(tenant: Tenant): Promise<void> {
    const repository = await this.repository();
    try {
      await repository.save(toTenantOrmEntity(tenant));
    } catch (error) {
      if (isUniqueViolation(error, TENANT_SLUG_UNIQUE_CONSTRAINT)) {
        throw new TenantSlugTakenError(tenant.slug);
      }
      throw error;
    }
  }

  async findById(tenantId: string): Promise<Tenant | null> {
    const entity = await (await this.repository()).findOneBy({ id: tenantId });
    return entity ? toTenantDomain(entity) : null;
  }

  async findBySlug(slug: TenantSlug): Promise<Tenant | null> {
    const entity = await (await this.repository()).findOneBy({ slug: slug.value });
    return entity ? toTenantDomain(entity) : null;
  }

  async findPage(request: PageRequest): Promise<Page<Tenant>> {
    const [entities, totalItems] = await (await this.repository()).findAndCount({
      order: { createdAt: 'DESC', id: 'ASC' },
      skip: Page.offsetOf(request),
      take: request.pageSize,
    });
    return new Page(entities.map(toTenantDomain), request.page, request.pageSize, totalItems);
  }

  private async repository(): Promise<Repository<TenantOrmEntity>> {
    return (await this.controlPlaneDatabase.dataSource()).getRepository(TenantOrmEntity);
  }
}
