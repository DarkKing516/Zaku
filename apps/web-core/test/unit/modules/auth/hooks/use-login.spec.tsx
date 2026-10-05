/** @jest-environment jsdom */
import { act, renderHook } from '@testing-library/react';
import type { FormEvent } from 'react';
import { useLogin } from '@/modules/auth/hooks/use-login';
import { ApiError } from '@/shared/client/api-client';

const mockLogin = jest.fn<Promise<unknown>, [unknown]>();
const mockReplace = jest.fn();
jest.mock('@/modules/auth/api', () => ({ authApi: { login: (input: unknown) => mockLogin(input) } }));
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: mockReplace, refresh: jest.fn() }) }));

const submitEvent = () => ({ preventDefault: jest.fn() }) as unknown as FormEvent<HTMLFormElement>;

const VALID_TENANT = '00000000-0000-4000-8000-000000000001';

describe('useLogin', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockLogin.mockReset();
    mockReplace.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function fillForm(result: { current: ReturnType<typeof useLogin> }, password = 'demo-password') {
    act(() => {
      result.current.setField('tenantId', VALID_TENANT);
      result.current.setField('email', 'demo@zaku.dev');
      result.current.setField('password', password);
    });
  }

  it('starts with the remembered tenant', () => {
    const { result } = renderHook(() => useLogin({ redirectTo: '/home', initialTenantId: VALID_TENANT }));

    expect(result.current.values.tenantId).toBe(VALID_TENANT);
  });

  it('validates in the browser before calling the BFF', async () => {
    const { result } = renderHook(() => useLogin({ redirectTo: '/home' }));

    await act(async () => {
      await result.current.submit(submitEvent());
    });

    expect(result.current.fieldErrors).toMatchObject({ tenantId: expect.any(String), email: expect.any(String), password: expect.any(String) });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('shows the splash and navigates to the requested page after a successful login', async () => {
    mockLogin.mockResolvedValue({ id: 'user-1' });
    const { result } = renderHook(() => useLogin({ redirectTo: '/users?page=2' }));
    fillForm(result);

    await act(async () => {
      await result.current.submit(submitEvent());
    });

    expect(mockLogin).toHaveBeenCalledWith({ tenantId: VALID_TENANT, email: 'demo@zaku.dev', password: 'demo-password' });
    expect(result.current.isRedirecting).toBe(true);
    act(() => {
      jest.runAllTimers();
    });
    expect(mockReplace).toHaveBeenCalledWith('/users?page=2');
  });

  it('keeps a general error apart from field errors returned by the BFF', async () => {
    mockLogin.mockRejectedValueOnce(new ApiError(401, 'USER_AUTH_INVALID_CREDENTIALS', 'Correo o contraseña incorrectos'));
    mockLogin.mockRejectedValueOnce(new ApiError(400, 'VALIDATION', 'Revisa los datos', { email: 'Correo inválido' }));
    const { result } = renderHook(() => useLogin({ redirectTo: '/home' }));
    fillForm(result, 'wrong');

    await act(async () => {
      await result.current.submit(submitEvent());
    });
    expect(result.current.formError?.message).toBe('Correo o contraseña incorrectos');

    await act(async () => {
      await result.current.submit(submitEvent());
    });
    expect(result.current.fieldErrors.email).toBe('Correo inválido');
    expect(result.current.formError).toBeUndefined();
  });
});
