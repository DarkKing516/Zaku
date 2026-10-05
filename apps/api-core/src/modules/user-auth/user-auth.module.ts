import { Module } from '@nestjs/common';
import { LoginUserHandler } from './application/commands/login-user/login-user.handler';
import { ACCESS_TOKEN_ISSUER } from './application/ports/access-token-issuer.port';
import { JwtAccessTokenIssuer } from './infrastructure/adapters/jwt-access-token.issuer';
import { UserAuthController } from './infrastructure/http/user-auth.controller';

@Module({
  controllers: [UserAuthController],
  providers: [LoginUserHandler, { provide: ACCESS_TOKEN_ISSUER, useClass: JwtAccessTokenIssuer }],
})
export class UserAuthModule {}
