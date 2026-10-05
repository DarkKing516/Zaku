import { UserEmailInvalidError } from '../errors/user.errors';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LENGTH = 254;

export class Email {
  private constructor(readonly value: string) {}

  static create(rawEmail: string): Email {
    const email = Email.tryCreate(rawEmail);
    if (!email) {
      throw new UserEmailInvalidError();
    }
    return email;
  }

  static tryCreate(rawEmail: string): Email | null {
    const normalized = rawEmail.trim().toLowerCase();
    if (normalized.length > MAX_LENGTH || !EMAIL_PATTERN.test(normalized)) {
      return null;
    }
    return new Email(normalized);
  }
}
