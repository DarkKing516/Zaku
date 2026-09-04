import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { tenantContext } from '../tenant/tenant-context';
import { AuthService } from './auth.service';

interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    tenantId: string;
  };
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const auth = req.header('authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = auth.replace('Bearer ', '');
    const payload = this.authService.validateToken(token);
    req.user = payload;
    tenantContext.set({ tenantId: payload.tenantId, userId: payload.sub });

    return true;
  }
}
