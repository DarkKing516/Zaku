/** @jest-environment jsdom */
import { act, renderHook } from '@testing-library/react';
import { ApiError } from '@/shared/client/api-client';
import { useApiMutation } from '@/shared/client/hooks/use-api-mutation';

describe('useApiMutation', () => {
  it('resolves to a successful outcome and clears the pending flag', async () => {
    const { result } = renderHook(() => useApiMutation(async (name: string) => ({ greeting: `hola ${name}` })));

    let outcome: Awaited<ReturnType<typeof result.current.mutate>> | undefined;
    await act(async () => {
      outcome = await result.current.mutate('zaku');
    });

    expect(outcome).toEqual({ ok: true, data: { greeting: 'hola zaku' } });
    expect(result.current).toMatchObject({ isPending: false, error: undefined });
  });

  it('never throws: failures come back as an outcome and are kept as the last error', async () => {
    const failure = new ApiError(409, 'USER_ALREADY_EXISTS', 'Ya existe');
    const { result } = renderHook(() => useApiMutation(async () => Promise.reject(failure)));

    let outcome: Awaited<ReturnType<typeof result.current.mutate>> | undefined;
    await act(async () => {
      outcome = await result.current.mutate(undefined);
    });

    expect(outcome).toEqual({ ok: false, error: failure });
    expect(result.current.error).toBe(failure);
  });
});
