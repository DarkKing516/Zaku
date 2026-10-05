import { AppError } from '@common/errors/app-error';

export class InvalidCredentialsError extends AppError {
  constructor() {
    super({
      code: 'USER_AUTH_INVALID_CREDENTIALS',
      category: 'UNAUTHORIZED',
      message: 'The email or password is incorrect',
    });
  }
}
