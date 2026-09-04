import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1700000000000 implements MigrationInterface {
  name = 'CreateUsers1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        tenant_id uuid NOT NULL,
        email varchar(255) NOT NULL,
        password_hash varchar(255) NOT NULL,
        CONSTRAINT uq_users_tenant_email UNIQUE (tenant_id, email)
      )
    `);
    await queryRunner.query('CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS users');
  }
}
