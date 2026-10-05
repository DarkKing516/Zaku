import { Column, Entity, Index, PrimaryColumn, Unique } from 'typeorm';

export const TENANT_SLUG_UNIQUE_CONSTRAINT = 'uq_tenants_slug';

@Entity({ name: 'tenants' })
@Unique(TENANT_SLUG_UNIQUE_CONSTRAINT, ['slug'])
@Unique('uq_tenants_database_name', ['databaseName'])
@Index('idx_tenants_created_at', ['createdAt'])
export class TenantOrmEntity {
  @PrimaryColumn({ type: 'uuid', primaryKeyConstraintName: 'pk_tenants' })
  id!: string;

  @Column({ type: 'varchar', length: 40 })
  slug!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 20 })
  status!: string;

  @Column({ name: 'database_name', type: 'varchar', length: 63 })
  databaseName!: string;

  @Column({ name: 'provisioning_error', type: 'text', nullable: true })
  provisioningError!: string | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;
}
