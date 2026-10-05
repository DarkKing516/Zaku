export type ErrorCategory =
  | 'VALIDATION'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'BUSINESS_RULE'
  | 'UNAVAILABLE'
  | 'INTERNAL';

export interface ErrorDetail {
  readonly field?: string;
  readonly message: string;
}

export interface AppErrorProps {
  readonly code: string;
  readonly category: ErrorCategory;
  readonly message: string;
  readonly details?: readonly ErrorDetail[];
  readonly cause?: unknown;
}

export abstract class AppError extends Error {
  readonly code: string;
  readonly category: ErrorCategory;
  readonly details: readonly ErrorDetail[];

  protected constructor({ code, category, message, details = [], cause }: AppErrorProps) {
    super(message, { cause });
    this.name = new.target.name;
    this.code = code;
    this.category = category;
    this.details = details;
  }
}
