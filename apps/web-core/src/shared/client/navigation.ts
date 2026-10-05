'use client';

import { useRouter } from 'next/navigation';

export function useAppNavigation() {
  const router = useRouter();
  return {
    goTo: (path: string) => {
      router.replace(path);
      // Invalidates the Router Cache so the layouts read the new session.
      router.refresh();
    },
  };
}
