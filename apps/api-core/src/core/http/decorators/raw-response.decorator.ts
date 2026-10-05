import { SetMetadata } from '@nestjs/common';

export const RAW_RESPONSE = 'http:raw-response';

export const RawResponse = (): MethodDecorator & ClassDecorator => SetMetadata(RAW_RESPONSE, true);
