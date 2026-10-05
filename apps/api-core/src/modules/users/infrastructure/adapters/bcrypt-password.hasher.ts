import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { PasswordHasherPort } from '../../application/ports/password-hasher.port';

const BCRYPT_COST = 10;

@Injectable()
export class BcryptPasswordHasher implements PasswordHasherPort {
  private decoyHash?: Promise<string>;

  hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, BCRYPT_COST);
  }

  async verify(plainPassword: string, passwordHash: string | null): Promise<boolean> {
    if (passwordHash === null) {
      // Comparing against a decoy keeps the response time identical for unknown accounts (prevents user enumeration).
      await bcrypt.compare(plainPassword, await this.decoy());
      return false;
    }
    return bcrypt.compare(plainPassword, passwordHash);
  }

  private decoy(): Promise<string> {
    this.decoyHash ??= bcrypt.hash(randomUUID(), BCRYPT_COST);
    return this.decoyHash;
  }
}
