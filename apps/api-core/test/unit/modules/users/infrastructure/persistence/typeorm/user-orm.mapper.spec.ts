import { User } from '@modules/users/domain/user';
import { Email } from '@modules/users/domain/value-objects/email';
import { toUserDomain, toUserOrmEntity } from '@modules/users/infrastructure/persistence/typeorm/user-orm.mapper';
import { UserOrmEntity } from '@modules/users/infrastructure/persistence/typeorm/user.orm-entity';

describe('user ORM mapper', () => {
  it('round-trips a user through the ORM entity', () => {
    const user = User.register(Email.create('jane@example.com'), 'hash');

    const entity = toUserOrmEntity(user);

    expect(entity).toBeInstanceOf(UserOrmEntity);
    expect(toUserDomain(entity).toSnapshot()).toEqual(user.toSnapshot());
  });
});
