'use client';

import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { useApiMutation } from '@/shared/client/hooks/use-api-mutation';
import { useAppNavigation } from '@/shared/client/navigation';
import { authApi } from '../api';
import { loginSchema, type LoginInput } from '../schemas';

type FieldErrors = Partial<Record<keyof LoginInput, string>>;

const SPLASH_DURATION_MS = 1800;

export function useLogin({ redirectTo, initialTenantId = '' }: { redirectTo: string; initialTenantId?: string }) {
  const { goTo } = useAppNavigation();
  const { mutate, isPending, error } = useApiMutation(authApi.login);

  const [values, setValues] = useState<LoginInput>({ tenantId: initialTenantId, email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isRedirecting, setIsRedirecting] = useState(false);

  const setField = (field: keyof LoginInput, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      const errors = z.flattenError(parsed.error).fieldErrors;
      setFieldErrors({ tenantId: errors.tenantId?.[0], email: errors.email?.[0], password: errors.password?.[0] });
      return;
    }

    const outcome = await mutate(parsed.data);
    if (outcome.ok) {
      setIsRedirecting(true);
      setTimeout(() => goTo(redirectTo), SPLASH_DURATION_MS);
      return;
    }
    if (outcome.error.fields) {
      setFieldErrors(outcome.error.fields);
    }
  };

  return {
    values,
    setField,
    fieldErrors,
    submit,
    isSubmitting: isPending || isRedirecting,
    isRedirecting,
    formError: error && !error.fields ? error : undefined,
  };
}
