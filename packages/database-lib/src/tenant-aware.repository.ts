import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseEntity } from './base.entity';
import { tenantContext } from './tenant-context';

export class TenantAwareRepository<T extends BaseEntity> extends Repository<T> {
  createTenantAwareQueryBuilder(alias: string): SelectQueryBuilder<T> {
    const tenantId = tenantContext.getTenantId();
    return this.createQueryBuilder(alias).andWhere(`${alias}.tenant_id = :tenantId`, { tenantId });
  }
}
