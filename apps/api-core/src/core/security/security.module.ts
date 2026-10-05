import { ExecutionContext, Global, Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppConfig } from '../config/app-config';
import { ACCESS_TOKEN_ALGORITHM, ACCESS_TOKEN_AUDIENCE, ACCESS_TOKEN_ISSUER } from './access-token.constants';
import { CREDENTIALS_PER_IP_THROTTLER, CREDENTIALS_THROTTLER, IS_CREDENTIALS_ROUTE } from './credentials-rate-limit.decorator';
import { credentialsTracker } from './credentials-tracker';

const reflector = new Reflector();

function isCredentialsRoute(context: ExecutionContext): boolean {
  return reflector.getAllAndOverride<boolean>(IS_CREDENTIALS_ROUTE, [context.getHandler(), context.getClass()]) === true;
}

export function accessTokenJwtOptions(config: AppConfig): JwtModuleOptions {
  return {
    secret: config.accessToken.secret,
    signOptions: {
      algorithm: ACCESS_TOKEN_ALGORITHM,
      expiresIn: config.accessToken.expiresInSeconds,
      issuer: ACCESS_TOKEN_ISSUER,
      audience: ACCESS_TOKEN_AUDIENCE,
    },
  };
}

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [AppConfig],
      useFactory: accessTokenJwtOptions,
    }),
    ThrottlerModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        throttlers: [
          { name: 'default', ttl: config.rateLimit.windowMs, limit: config.rateLimit.maxRequests },
          {
            name: CREDENTIALS_THROTTLER,
            ttl: config.rateLimit.windowMs,
            limit: config.rateLimit.credentialsMaxRequests,
            skipIf: (context: ExecutionContext) => !isCredentialsRoute(context),
            getTracker: credentialsTracker,
          },
          {
            name: CREDENTIALS_PER_IP_THROTTLER,
            ttl: config.rateLimit.windowMs,
            limit: config.rateLimit.credentialsPerIpMaxRequests,
            skipIf: (context: ExecutionContext) => !isCredentialsRoute(context),
          },
        ],
      }),
    }),
  ],
  exports: [JwtModule, ThrottlerModule],
})
export class SecurityModule {}
