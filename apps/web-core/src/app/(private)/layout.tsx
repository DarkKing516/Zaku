import type { ReactNode } from 'react';
import { AppShell } from '@/layout/AppShell';
import { SessionWatcher } from '@/modules/auth/components/SessionWatcher';
import { requireUser } from '@/shared/server/session';

export default async function PrivateLayout({ children }: { children: ReactNode }) {
  await requireUser();

  return (
    <>
      <AppShell>{children}</AppShell>
      <SessionWatcher />
    </>
  );
}
