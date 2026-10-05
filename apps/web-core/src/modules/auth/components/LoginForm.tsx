'use client';

import { ArrowRight, Building2, ChevronLeft, LockKeyhole, Mail, UserRound } from 'lucide-react';
import Link from 'next/link';
import { APP_NAME } from '@/shared/constants';
import { Button } from '@/shared/ui/Button';
import { TextField } from '@/shared/ui/Field';
import { SplashLoading } from '@/shared/ui/SplashLoading';
import { InlineAlert } from '@/shared/ui/states';
import { useLogin } from '../hooks/use-login';
import type { DemoCredentials } from '../types';

interface LoginFormProps {
  readonly redirectTo: string;
  readonly initialTenantId?: string;
  readonly demoCredentials?: DemoCredentials;
}

export function LoginForm({ redirectTo, initialTenantId, demoCredentials }: LoginFormProps) {
  const { values, setField, fieldErrors, submit, isSubmitting, isRedirecting, formError } = useLogin({ redirectTo, initialTenantId });

  if (isRedirecting) {
    return <SplashLoading />;
  }

  return (
    <div className="group relative w-full max-w-[420px] overflow-hidden rounded-[2.5rem] border border-white/40 bg-white/80 p-10 shadow-premium backdrop-blur-xl">
      <div aria-hidden className="absolute -right-12 -top-12 size-40 rounded-full bg-primary-100 opacity-60 transition-transform duration-700 ease-out group-hover:scale-110" />
      <div aria-hidden className="absolute -bottom-8 -left-8 size-24 rounded-full bg-secondary-100 opacity-40 transition-transform duration-1000 ease-in-out group-hover:scale-125" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-6 grid size-16 place-items-center rounded-3xl border border-primary-100 bg-primary-50 text-primary-600 shadow-sm">
          <UserRound className="size-8" aria-hidden />
        </div>
        <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-ink">Inicia sesión</h1>
        <p className="mb-8 text-[10px] font-bold uppercase tracking-widest text-muted">{APP_NAME}</p>

        <form onSubmit={submit} noValidate className="w-full space-y-5">
          {formError && <InlineAlert>{formError.message}</InlineAlert>}

          <TextField
            label="Organización (ID)"
            icon={<Building2 className="size-5" aria-hidden />}
            value={values.tenantId}
            onChange={(event) => setField('tenantId', event.target.value)}
            error={fieldErrors.tenantId}
            placeholder="00000000-0000-4000-8000-000000000000"
            autoComplete="organization"
            spellCheck={false}
            disabled={isSubmitting}
          />
          <TextField
            label="Correo electrónico"
            type="email"
            icon={<Mail className="size-5" aria-hidden />}
            value={values.email}
            onChange={(event) => setField('email', event.target.value)}
            error={fieldErrors.email}
            placeholder="tu@ejemplo.com"
            autoComplete="username"
            disabled={isSubmitting}
          />
          <TextField
            label="Contraseña"
            type="password"
            icon={<LockKeyhole className="size-5" aria-hidden />}
            value={values.password}
            onChange={(event) => setField('password', event.target.value)}
            error={fieldErrors.password}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={isSubmitting}
          />

          <div className="pt-4">
            <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
              {!isSubmitting && (
                <>
                  Ingresar <ArrowRight className="size-5" aria-hidden />
                </>
              )}
            </Button>
          </div>

          {demoCredentials && (
            <details className="rounded-control bg-soft text-xs leading-relaxed text-muted">
              <summary className="cursor-pointer px-3.5 py-2.5 font-medium text-ink">Cuenta de prueba (mocks)</summary>
              <div className="space-y-0.5 px-3.5 pb-3 font-mono">
                <p>{demoCredentials.tenantId}</p>
                <p>{demoCredentials.email}</p>
                <p>{demoCredentials.password}</p>
              </div>
            </details>
          )}
        </form>

        <Link href="/" className="group/back mt-8 flex cursor-pointer items-center justify-center gap-1 text-xs font-bold text-muted transition-colors hover:text-primary-600">
          <ChevronLeft className="size-4 transition-transform group-hover/back:-translate-x-1" aria-hidden />
          Atrás
        </Link>
      </div>
    </div>
  );
}
