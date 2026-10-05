import 'server-only';
import { mapResult, type Result } from '@/shared/server/http';
import type { ServiceContext } from '@/shared/server/service-context';
import { USERS_PAGE_SIZE } from '../schemas';
import type { UsersPage } from '../types';
import { toUsersPage } from './users.mappers';
import { UsersService } from './users.service';

export async function loadUsersPage(context: ServiceContext, page: number): Promise<Result<UsersPage>> {
  return mapResult(await UsersService.listPage(context, page, USERS_PAGE_SIZE), toUsersPage);
}
