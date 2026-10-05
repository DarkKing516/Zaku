import 'server-only';
import type { Paged } from '@/shared/server/http';
import type { UserSummary, UsersPage } from '../types';
import type { UserResponse } from './contracts';

export const toUserSummary = (user: UserResponse): UserSummary => ({ id: user.id, email: user.email, createdAt: user.createdAt });

export const toUsersPage = (page: Paged<UserResponse>): UsersPage => ({ items: page.items.map(toUserSummary), pagination: page.pagination });
