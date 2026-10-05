import { BcryptPasswordHasher } from '@modules/users/infrastructure/adapters/bcrypt-password.hasher';

describe('BcryptPasswordHasher', () => {
  const hasher = new BcryptPasswordHasher();

  it('produces a salted bcrypt hash that verifies only the original password', async () => {
    const hash = await hasher.hash('secure-password');

    expect(hash).toMatch(/^\$2[aby]\$10\$/);
    expect(hash).not.toBe(await hasher.hash('secure-password'));
    await expect(hasher.verify('secure-password', hash)).resolves.toBe(true);
    await expect(hasher.verify('other-password', hash)).resolves.toBe(false);
  });

  it('returns false when there is no stored hash', async () => {
    await expect(hasher.verify('secure-password', null)).resolves.toBe(false);
  });
});
