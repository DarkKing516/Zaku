import { User } from '@modules/users/domain/user';
import { Email } from '@modules/users/domain/value-objects/email';

describe('User', () => {
  it('registers with a generated id, the normalized email and the given hash', () => {
    const user = User.register(Email.create('Jane@Example.com'), 'hashed-secret');

    expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(user.email).toBe('jane@example.com');
    expect(user.passwordHash).toBe('hashed-secret');
    expect(user.toSnapshot().createdAt).toEqual(user.toSnapshot().updatedAt);
  });

  it('restores from a snapshot without sharing references', () => {
    const snapshot = User.register(Email.create('jane@example.com'), 'hash').toSnapshot();
    const restored = User.restore(snapshot);

    expect(restored.toSnapshot()).toEqual(snapshot);
    expect(restored.toSnapshot()).not.toBe(snapshot);
  });
});
