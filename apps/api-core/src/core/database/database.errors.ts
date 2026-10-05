import { AppError } from '@common/errors/app-error';

export class DatabaseUnavailableError extends AppError {
  constructor(databaseName: string, cause: unknown) {
    super({
      code: 'DATABASE_UNAVAILABLE',
      category: 'UNAVAILABLE',
      message: 'The database is temporarily unavailable',
      cause: new Error(`Could not connect to database "${databaseName}"`, { cause }),
    });
  }
}
