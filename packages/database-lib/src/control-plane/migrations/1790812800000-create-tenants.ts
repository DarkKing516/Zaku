import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTenants1790812800000 implements MigrationInterface {
  name = 'CreateTenants1790812800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE tenants (
        id uuid NOT NULL,
        slug varchar(40) NOT NULL,
        name varchar(100) NOT NULL,
        status varchar(20) NOT NULL,
        database_name varchar(63) NOT NULL,
        provisioning_error text NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT pk_tenants PRIMARY KEY (id),
        CONSTRAINT uq_tenants_slug UNIQUE (slug),
        CONSTRAINT uq_tenants_database_name UNIQUE (database_name)
      )
    `);
    await queryRunner.query('CREATE INDEX idx_tenants_created_at ON tenants (created_at)');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE tenants');
  }
}
