import { User } from '../../../domain/user';
import { UserOrmEntity } from './user.orm-entity';

export function toUserOrmEntity(user: User): UserOrmEntity {
  return Object.assign(new UserOrmEntity(), user.toSnapshot());
}

export function toUserDomain(entity: UserOrmEntity): User {
  return User.restore({
    id: entity.id,
    email: entity.email,
    passwordHash: entity.passwordHash,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  });
}
