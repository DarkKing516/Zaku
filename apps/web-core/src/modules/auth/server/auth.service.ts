import 'server-only';
import { http, mock, type Result } from '@/shared/server/http';
import type { ServiceContext } from '@/shared/server/service-context';
import { authMock } from './auth.mock';
import type { LoginRequest, LoginResponse } from './contracts';

export interface LoginCommand {
  readonly tenantId: string;
  readonly email: string;
  readonly password: string;
}

export class AuthService {
  static async login(context: ServiceContext, command: LoginCommand): Promise<Result<LoginResponse>> {
    const request: LoginRequest = { email: command.email, password: command.password };

    return mock('Core.user-auth.login', () => authMock.login(command.tenantId, request));
    return http.post<LoginResponse, LoginRequest>({
      context,
      api: 'Core',
      controller: 'user-auth',
      action: 'login',
      tenantId: command.tenantId,
      data: request,
    });
  }
}
