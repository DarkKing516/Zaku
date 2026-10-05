import { QueryFailedError } from 'typeorm';

const UNIQUE_VIOLATION = '23505';
const CONNECTION_EXCEPTION_CLASS = '08';
const TRANSIENT_SQLSTATES = new Set(['53300', '57014', '57P01', '57P02', '57P03']);
const TRANSIENT_NETWORK_CODES = new Set(['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EPIPE', 'ENOTFOUND']);
const TRANSIENT_DRIVER_MESSAGES = ['timeout exceeded when trying to connect', 'Connection terminated'];

function codeOf(error: object): string | undefined {
  const code: unknown = 'code' in error ? error.code : undefined;
  return typeof code === 'string' ? code : undefined;
}

export function isUniqueViolation(error: unknown, constraintName: string): boolean {
  if (!(error instanceof QueryFailedError)) {
    return false;
  }
  const driverError: unknown = error.driverError;
  if (typeof driverError !== 'object' || driverError === null) {
    return false;
  }
  return (
    codeOf(driverError) === UNIQUE_VIOLATION &&
    'constraint' in driverError &&
    driverError.constraint === constraintName
  );
}

export function isTransientDatabaseError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const driverError: unknown = error instanceof QueryFailedError ? error.driverError : error;
  const code = typeof driverError === 'object' && driverError !== null ? codeOf(driverError) : undefined;
  if (code && (code.startsWith(CONNECTION_EXCEPTION_CLASS) || TRANSIENT_SQLSTATES.has(code) || TRANSIENT_NETWORK_CODES.has(code))) {
    return true;
  }
  return TRANSIENT_DRIVER_MESSAGES.some((message) => error.message.includes(message));
}
