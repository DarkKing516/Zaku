import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_ROUTE = 'security:is-public-route';

export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_ROUTE, true);
