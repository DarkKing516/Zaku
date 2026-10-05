import { UserPasswordPolicyError } from './errors/user.errors';

const MIN_PASSWORD_BYTES = 8;
const MAX_PASSWORD_BYTES = 72;

export function assertPasswordMeetsPolicy(plainPassword: string): void {
  const passwordBytes = Buffer.byteLength(plainPassword, 'utf8');
  if (passwordBytes < MIN_PASSWORD_BYTES || passwordBytes > MAX_PASSWORD_BYTES) {
    throw new UserPasswordPolicyError();
  }
}
