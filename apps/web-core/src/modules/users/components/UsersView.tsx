import { Card } from '@/shared/ui/Card';
import { Pagination } from '@/shared/ui/Pagination';
import { EmptyState, ErrorState } from '@/shared/ui/states';
import { formatDate } from '@/shared/utils/format';
import type { UsersPage } from '../types';

type UsersViewProps = { readonly page: UsersPage } | { readonly errorMessage: string };

const usersHref = (page: number) => `/users?page=${page}`;

export function UsersView(props: UsersViewProps) {
  if ('errorMessage' in props) {
    return (
      <Card>
        <ErrorState message={props.errorMessage} />
      </Card>
    );
  }

  const { items, pagination } = props.page;
  if (items.length === 0) {
    return (
      <Card>
        <EmptyState title="Sin usuarios en esta página" description="Vuelve a la primera página o registra un usuario nuevo." />
      </Card>
    );
  }

  return (
    <Card className="p-2 sm:p-4">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Usuarios del tenant</caption>
        <thead>
          <tr className="text-xs uppercase tracking-wider text-muted">
            <th scope="col" className="px-4 py-3 font-bold">
              Correo
            </th>
            <th scope="col" className="hidden px-4 py-3 font-bold sm:table-cell">
              Creado
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((user) => (
            <tr key={user.id} className="border-t border-line/70">
              <td className="px-4 py-3 font-medium text-ink">{user.email}</td>
              <td className="hidden px-4 py-3 text-muted sm:table-cell">{formatDate(user.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-line/70 px-2 pt-3">
        <Pagination page={pagination.page} totalPages={pagination.totalPages} hrefFor={usersHref} />
      </div>
    </Card>
  );
}
