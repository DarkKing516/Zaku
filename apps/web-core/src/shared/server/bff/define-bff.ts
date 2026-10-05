import 'server-only';
import type { IronSession } from 'iron-session';
import type { z, ZodType } from 'zod';
import type { BffErrorBody } from '../../types/api';
import type { SessionUser } from '../../types/session-user';
import { fail, type ErrorModel, type Result } from '../http/result';
import { logger } from '../logger';
import { createServiceContext, type ServiceContext } from '../service-context';
import { getSession } from '../session';
import { isActiveSession, type SessionData } from '../session-options';

type RouteParams = Record<string, string>;

interface BffOptions<TBody, TQuery> {
  readonly body?: ZodType<TBody>;
  readonly query?: ZodType<TQuery>;
  readonly successStatus?: number;
}

export interface BffContext<TBody, TQuery, TUser> {
  readonly request: Request;
  readonly params: RouteParams;
  readonly body: TBody;
  readonly query: TQuery;
  readonly session: IronSession<SessionData>;
  readonly user: TUser;
  readonly service: ServiceContext;
}

type RouteContext = { params: Promise<RouteParams> };
export type RouteHandler = (request: Request, context: RouteContext) => Promise<Response>;

const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;
const GENERIC_SERVER_ERROR = 'El servicio no está disponible. Intenta nuevamente en unos minutos.';

export function privateBff<T, TBody = undefined, TQuery = Record<string, string>>(
  options: BffOptions<TBody, TQuery>,
  handler: (context: BffContext<TBody, TQuery, SessionUser>) => Promise<Result<T>>,
): RouteHandler {
  return run(options, true, handler as (context: BffContext<TBody, TQuery, SessionUser | undefined>) => Promise<Result<T>>);
}

export function publicBff<T, TBody = undefined, TQuery = Record<string, string>>(
  options: BffOptions<TBody, TQuery>,
  handler: (context: BffContext<TBody, TQuery, SessionUser | undefined>) => Promise<Result<T>>,
): RouteHandler {
  return run(options, false, handler);
}

function run<T, TBody, TQuery>(
  options: BffOptions<TBody, TQuery>,
  requireSession: boolean,
  handler: (context: BffContext<TBody, TQuery, SessionUser | undefined>) => Promise<Result<T>>,
): RouteHandler {
  return async (request, routeContext) => {
    const incomingRequestId = request.headers.get('x-request-id');
    const requestId = incomingRequestId && REQUEST_ID_PATTERN.test(incomingRequestId) ? incomingRequestId : crypto.randomUUID();
    const scope = `bff ${request.method} ${new URL(request.url).pathname}`;

    try {
      if (!isSafeMethod(request.method) && !isSameOrigin(request)) {
        return respondError(fail(403, 'Origen no permitido', 'FORBIDDEN_ORIGIN').error, requestId);
      }

      const session = await getSession();
      const activeUser = isActiveSession(session) ? session.user : undefined;
      if (requireSession && !activeUser) {
        return respondError(fail(401, 'Tu sesión expiró. Inicia sesión nuevamente.', 'UNAUTHENTICATED').error, requestId);
      }

      const query = parseQuery(request, options.query);
      if (!query.ok) {
        return respondError(query.error, requestId);
      }
      const body = await parseBody(request, options.body);
      if (!body.ok) {
        return respondError(body.error, requestId);
      }

      const service = createServiceContext(
        request.headers,
        { tenantId: activeUser?.tenantId, accessToken: activeUser ? session.accessToken : undefined },
        requestId,
      );
      const result = await handler({
        request,
        params: await routeContext.params,
        body: body.data,
        query: query.data,
        session,
        user: activeUser,
        service,
      });

      if (result.ok) {
        return Response.json(result.data ?? null, { status: options.successStatus ?? 200, headers: baseHeaders(requestId) });
      }
      logger.warn(scope, `service answered ${result.error.status} ${result.error.code}`, { requestId });
      return respondError(result.error, requestId);
    } catch (error) {
      logger.error(scope, 'unhandled exception in the BFF', { requestId, error: String(error) });
      return respondError({ status: 500, code: 'INTERNAL', message: GENERIC_SERVER_ERROR }, requestId);
    }
  };
}

function parseQuery<TQuery>(request: Request, schema?: ZodType<TQuery>): Result<TQuery> {
  const raw = Object.fromEntries(new URL(request.url).searchParams);
  if (!schema) {
    return { ok: true, data: raw as TQuery };
  }
  const parsed = schema.safeParse(raw);
  return parsed.success ? { ok: true, data: parsed.data } : { ok: false, error: validationError(parsed.error) };
}

async function parseBody<TBody>(request: Request, schema?: ZodType<TBody>): Promise<Result<TBody>> {
  if (!schema) {
    return { ok: true, data: undefined as TBody };
  }
  const json: unknown = await request.json().catch(() => undefined);
  const parsed = schema.safeParse(json);
  return parsed.success ? { ok: true, data: parsed.data } : { ok: false, error: validationError(parsed.error) };
}

const isSafeMethod = (method: string) => method === 'GET' || method === 'HEAD' || method === 'OPTIONS';

// CSRF defense on top of SameSite=Lax: a browser always sends Origin on unsafe methods.
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) {
    return true;
  }
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function validationError(error: z.ZodError): ErrorModel {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    fields[issue.path.join('.') || '_'] ??= issue.message;
  }
  return { status: 400, code: 'VALIDATION', message: 'Revisa los datos ingresados', fields };
}

function respondError(error: ErrorModel, requestId: string): Response {
  const status = error.status >= 400 && error.status <= 599 ? error.status : 500;
  const body: BffErrorBody = {
    error: {
      code: error.code,
      message: status >= 500 ? GENERIC_SERVER_ERROR : error.message,
      ...(error.fields ? { fields: error.fields } : {}),
    },
  };
  return Response.json(body, { status, headers: baseHeaders(requestId) });
}

const baseHeaders = (requestId: string) => ({ 'Cache-Control': 'no-store', 'x-request-id': requestId });
