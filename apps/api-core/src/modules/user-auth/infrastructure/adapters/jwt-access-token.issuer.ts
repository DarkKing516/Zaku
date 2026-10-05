import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfig } from '@core/config/app-config';
import { claimsFromPrincipal } from '@core/security/access-token-claims';
import { PrincipalType } from '@core/security/authenticated-principal';
import {
  AccessTokenIssuerPort,
  AccessTokenSubject,
  IssuedAccessToken,
} from '../../application/ports/access-token-issuer.port';

@Injectable()
export class JwtAccessTokenIssuer implements AccessTokenIssuerPort {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: AppConfig,
  ) {}

  async issue(subject: AccessTokenSubject): Promise<IssuedAccessToken> {
    const claims = claimsFromPrincipal({
      subjectId: subject.userId,
      tenantId: subject.tenantId,
      type: PrincipalType.User,
    });
    return {
      accessToken: await this.jwtService.signAsync({ ...claims }),
      tokenType: 'Bearer',
      expiresInSeconds: this.config.accessToken.expiresInSeconds,
    };
  }
}
