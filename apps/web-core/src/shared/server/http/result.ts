import 'server-only';

export interface ErrorModel {
  readonly status: number;
  readonly code: string;
  readonly message: string;
  readonly fields?: Readonly<Record<string, string>>;
}

export type Failure = { readonly ok: false; readonly error: ErrorModel };
export type Result<T> = { readonly ok: true; readonly data: T } | Failure;

export const ok = <T>(data: T): Result<T> => ({ ok: true, data });

export const fail = (status: number, message: string, code = `HTTP_${status}`, fields?: Record<string, string>): Failure => ({
  ok: false,
  error: { status, code, message, fields },
});

export function mapResult<T, U>(result: Result<T>, transform: (data: T) => U): Result<U> {
  return result.ok ? ok(transform(result.data)) : result;
}
