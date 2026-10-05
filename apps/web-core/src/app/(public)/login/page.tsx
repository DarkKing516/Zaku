import type { Metadata } from 'next';
import { LoginForm } from '@/modules/auth/components/LoginForm';
import { demoCredentialsForLocalEnvironment } from '@/modules/auth/server/auth.bff';
import { rememberedTenant } from '@/modules/auth/server/remembered-tenant';
import { safeRedirectPath } from '@/shared/utils/safe-redirect';

export const metadata: Metadata = { title: 'Ingresar' };

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const { next } = await searchParams;

  return (
    <LoginForm
      redirectTo={safeRedirectPath(typeof next === 'string' ? next : undefined)}
      initialTenantId={await rememberedTenant()}
      demoCredentials={demoCredentialsForLocalEnvironment()}
    />
  );
}
