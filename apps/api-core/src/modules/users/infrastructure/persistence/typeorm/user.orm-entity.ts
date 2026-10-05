import { Column, Entity, Index, PrimaryColumn, Unique } from 'typeorm';

export const USER_EMAIL_UNIQUE_CONSTRAINT = 'uq_users_email';

@Entity({ name: 'users' })
@Unique(USER_EMAIL_UNIQUE_CONSTRAINT, ['email'])
@Index('idx_users_created_at', ['createdAt'])
export class UserOrmEntity {
  @PrimaryColumn({ type: 'uuid', primaryKeyConstraintName: 'pk_users' })
  id!: string;

  @Column({ type: 'varchar', length: 254 })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;
}
