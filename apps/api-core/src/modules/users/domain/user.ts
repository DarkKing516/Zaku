import { randomUUID } from 'node:crypto';
import { Email } from './value-objects/email';

export interface UserSnapshot {
  readonly id: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class User {
  private constructor(private readonly state: UserSnapshot) {}

  static register(email: Email, passwordHash: string): User {
    const now = new Date();
    return new User({ id: randomUUID(), email: email.value, passwordHash, createdAt: now, updatedAt: now });
  }

  static restore(snapshot: UserSnapshot): User {
    return new User({ ...snapshot });
  }

  get id(): string {
    return this.state.id;
  }

  get email(): string {
    return this.state.email;
  }

  get passwordHash(): string {
    return this.state.passwordHash;
  }

  toSnapshot(): UserSnapshot {
    return { ...this.state };
  }
}
