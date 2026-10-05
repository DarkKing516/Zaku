import type { PaginationMeta } from '@zaku/shared-types';

export interface UserSummary {
  readonly id: string;
  readonly email: string;
  readonly createdAt: string;
}

export interface UsersPage {
  readonly items: readonly UserSummary[];
  readonly pagination: PaginationMeta;
}
