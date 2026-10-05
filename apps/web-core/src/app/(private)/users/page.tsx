import { Users } from 'lucide-react';
import type { Metadata } from 'next';
import { UsersView } from '@/modules/users/components/UsersView';
import { usersPageQuerySchema } from '@/modules/users/schemas';
import { loadUsersPage } from '@/modules/users/server/users.bff';
import { getServerServiceContext } from '@/shared/server/next-context';
import { requireUser } from '@/shared/server/session';
import { PageHeader } from '@/shared/ui/PageHeader';

export const metadata: Metadata = { title: 'Usuarios' };

export default async function UsersPage({ searchParams }: PageProps<'/users'>) {
  await requireUser();
  const { page } = usersPageQuerySchema.parse(await searchParams);
  const result = await loadUsersPage(await getServerServiceContext(), page);

  return (
    <>
      <PageHeader title="Usuarios" description="Personas con acceso a tu organización." icon={<Users className="size-7" aria-hidden />} />
      {result.ok ? <UsersView page={result.data} /> : <UsersView errorMessage={result.error.message} />}
    </>
  );
}
