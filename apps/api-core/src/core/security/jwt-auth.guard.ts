import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { RequestContext } from '../request-context/request-context';
import { ACCESS_TOKEN_ALGORITHM, ACCESS_TOKEN_AUDIENCE, ACCESS_TOKEN_ISSUER } from './access-token.constants';
import { principalFromClaims } from './access-token-claims';
import { AccessTokenExpiredError, AccessTokenInvalidError, AccessTokenMissingError } from './access-token.errors';
import { AuthenticatedPrincipal } from './authenticated-principal';
import { IS_PUBLIC_ROUTE } from './public.decorator';

const BEARER_PREFIX = 'Bearer ';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublicRoute = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ROUTE, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublicRoute) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const principal = await this.verify(this.extractBearerToken(request));
    RequestContext.bindPrincipal(principal);
    return true;
  }

  private extractBearerToken(request: Request): string {
    const authorization = request.header('authorization');
    if (!authorization?.startsWith(BEARER_PREFIX)) {
      throw new AccessTokenMissingError();
    }
    const token = authorization.slice(BEARER_PREFIX.length).trim();
    if (token === '') {
      throw new AccessTokenMissingError();
    }
    return token;
  }

  private async verify(token: string): Promise<AuthenticatedPrincipal> {
    let claims: Record<string, unknown>;
    try {
      claims = await this.jwtService.verifyAsync<Record<string, unknown>>(token, {
        algorithms: [ACCESS_TOKEN_ALGORITHM],
        issuer: ACCESS_TOKEN_ISSUER,
        audience: ACCESS_TOKEN_AUDIENCE,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new AccessTokenExpiredError();
      }
      throw new AccessTokenInvalidError();
    }

    const principal = principalFromClaims(claims);
    if (!principal) {
      throw new AccessTokenInvalidError();
    }
    return principal;
  }
}
