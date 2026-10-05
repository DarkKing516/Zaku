import 'server-only';
import { http, mock, type Paged, type Result } from '@/shared/server/http';
import type { ServiceContext } from '@/shared/server/service-context';
import type { UserResponse } from './contracts';
import { usersMock } from './users.mock';

export class UsersService {
  static async listPage(context: ServiceContext, page: number, pageSize: number): Promise<Result<Paged<UserResponse>>> {
    return mock('Core.users.list', () => usersMock.listPage(context.tenantId, page, pageSize));
    return http.getPage<UserResponse>({
      context,
      api: 'Core',
      controller: 'users',
      action: '',
      withAuth: true,
      queryParams: { page, pageSize },
    });
  }
}
