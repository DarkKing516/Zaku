import { SetMetadata } from '@nestjs/common';

export const IS_CREDENTIALS_ROUTE = 'security:is-credentials-route';
export const CREDENTIALS_THROTTLER = 'credentials';
export const CREDENTIALS_PER_IP_THROTTLER = 'credentials-per-ip';

export const CredentialsRateLimit = (): MethodDecorator & ClassDecorator => SetMetadata(IS_CREDENTIALS_ROUTE, true);
