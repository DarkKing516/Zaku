import { apiClient } from '@/shared/client/api-client';
import type { LoginInput } from './schemas';
import type { SessionUser } from './types';

export const authApi = {
  login: (input: LoginInput) => apiClient.post<SessionUser>('/api/auth/login', input),
  logout: () => apiClient.post<{ loggedOut: boolean }>('/api/auth/logout'),
};
