import { z } from 'zod';

export const USERS_PAGE_SIZE = 10;

export const usersPageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
});
