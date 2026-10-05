import { UserPasswordPolicyError } from '@modules/users/domain/errors/user.errors';
import { assertPasswordMeetsPolicy } from '@modules/users/domain/password-policy';

describe('assertPasswordMeetsPolicy', () => {
  it('accepts passwords between 8 and 72 bytes', () => {
    expect(() => assertPasswordMeetsPolicy('12345678')).not.toThrow();
    expect(() => assertPasswordMeetsPolicy('x'.repeat(72))).not.toThrow();
  });

  it('rejects short passwords', () => {
    expect(() => assertPasswordMeetsPolicy('1234567')).toThrow(UserPasswordPolicyError);
  });

  it('measures bytes, not characters, because bcrypt silently truncates after 72 bytes', () => {
    const thirtySevenTwoByteCharacters = 'ñ'.repeat(37);

    expect(thirtySevenTwoByteCharacters).toHaveLength(37);
    expect(() => assertPasswordMeetsPolicy(thirtySevenTwoByteCharacters)).toThrow(UserPasswordPolicyError);
  });
});
