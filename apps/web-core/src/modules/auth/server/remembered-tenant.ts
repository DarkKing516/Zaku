import 'server-only';
import { cookies } from 'next/headers';
import { isProduction } from '@/shared/server/env';
import { tenantIdSchema } from '../schemas';

const TENANT_COOKIE = 'zaku-tenant';
const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

export async function rememberTenant(tenantId: string): Promise<void> {
  (await cookies()).set(TENANT_COOKIE, tenantId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction(),
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
  });
}

export async function rememberedTenant(): Promise<string | undefined> {
  const parsed = tenantIdSchema.safeParse((await cookies()).get(TENANT_COOKIE)?.value);
  return parsed.success ? parsed.data : undefined;
}
