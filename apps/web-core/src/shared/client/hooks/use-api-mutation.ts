'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toApiError, type ApiError } from '../api-client';

export type MutationOutcome<T> = { readonly ok: true; readonly data: T } | { readonly ok: false; readonly error: ApiError };

export function useApiMutation<TInput, TOutput>(mutator: (input: TInput) => Promise<TOutput>) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<ApiError | undefined>();

  const latestMutator = useRef(mutator);
  useEffect(() => {
    latestMutator.current = mutator;
  });

  const mutate = useCallback(async (input: TInput): Promise<MutationOutcome<TOutput>> => {
    setIsPending(true);
    setError(undefined);
    try {
      return { ok: true, data: await latestMutator.current(input) };
    } catch (caught) {
      const apiError = toApiError(caught);
      setError(apiError);
      return { ok: false, error: apiError };
    } finally {
      setIsPending(false);
    }
  }, []);

  return { mutate, isPending, error };
}
