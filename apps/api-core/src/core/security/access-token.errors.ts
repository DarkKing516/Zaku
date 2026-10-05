import { AppError } from '@common/errors/app-error';

export class AccessTokenMissingError extends AppError {
  constructor() {
    super({ code: 'AUTH_TOKEN_MISSING', category: 'UNAUTHORIZED', message: 'A bearer access token is required' });
  }
}

export class AccessTokenInvalidError extends AppError {
  constructor() {
    super({ code: 'AUTH_TOKEN_INVALID', category: 'UNAUTHORIZED', message: 'The access token is invalid' });
  }
}

export class AccessTokenExpiredError extends AppError {
  constructor() {
    super({ code: 'AUTH_TOKEN_EXPIRED', category: 'UNAUTHORIZED', message: 'The access token has expired' });
  }
}
