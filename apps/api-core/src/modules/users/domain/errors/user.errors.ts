import { AppError } from '@common/errors/app-error';

export class UserEmailInvalidError extends AppError {
  constructor() {
    super({
      code: 'USER_EMAIL_INVALID',
      category: 'VALIDATION',
      message: 'The email address is not valid',
      details: [{ field: 'email', message: 'must be a valid email address' }],
    });
  }
}

export class UserPasswordPolicyError extends AppError {
  constructor() {
    super({
      code: 'USER_PASSWORD_POLICY_VIOLATION',
      category: 'VALIDATION',
      message: 'The password must have between 8 and 72 bytes',
      details: [{ field: 'password', message: 'must have between 8 and 72 bytes' }],
    });
  }
}

export class UserAlreadyExistsError extends AppError {
  constructor(email: string) {
    super({ code: 'USER_ALREADY_EXISTS', category: 'CONFLICT', message: `A user with email "${email}" already exists` });
  }
}

export class UserNotFoundError extends AppError {
  constructor(userId: string) {
    super({ code: 'USER_NOT_FOUND', category: 'NOT_FOUND', message: `User "${userId}" was not found` });
  }
}
