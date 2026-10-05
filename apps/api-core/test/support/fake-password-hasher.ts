import { PasswordHasherPort } from '@modules/users/application/ports/password-hasher.port';

export class FakePasswordHasher implements PasswordHasherPort {
  readonly verifiedAgainstMissingHash: string[] = [];

  async hash(plainPassword: string): Promise<string> {
    return `hashed:${plainPassword}`;
  }

  async verify(plainPassword: string, passwordHash: string | null): Promise<boolean> {
    if (passwordHash === null) {
      this.verifiedAgainstMissingHash.push(plainPassword);
      return false;
    }
    return passwordHash === `hashed:${plainPassword}`;
  }
}
