import { UserEmailInvalidError } from '@modules/users/domain/errors/user.errors';
import { Email } from '@modules/users/domain/value-objects/email';

describe('Email', () => {
  it('normalizes case and whitespace so lookups are case-insensitive', () => {
    expect(Email.create('  John.Doe@Example.COM ').value).toBe('john.doe@example.com');
  });

  it.each(['', 'plain', 'a@b', 'a b@example.com', `${'x'.repeat(250)}@example.com`])('rejects %p', (rawEmail) => {
    expect(() => Email.create(rawEmail)).toThrow(UserEmailInvalidError);
    expect(Email.tryCreate(rawEmail)).toBeNull();
  });
});
