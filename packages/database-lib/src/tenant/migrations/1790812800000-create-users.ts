import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1790812800000 implements MigrationInterface {
  name = 'CreateUsers1790812800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE users (
        id uuid NOT NULL,
        email varchar(254) NOT NULL,
        password_hash varchar(255) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT pk_users PRIMARY KEY (id),
        CONSTRAINT uq_users_email UNIQUE (email)
      )
    `);
    await queryRunner.query('CREATE INDEX idx_users_created_at ON users (created_at)');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE users');
  }
}
