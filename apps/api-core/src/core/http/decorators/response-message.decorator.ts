import { SetMetadata } from '@nestjs/common';

export const RESPONSE_MESSAGE = 'http:response-message';

export const ResponseMessage = (message: string): MethodDecorator & ClassDecorator =>
  SetMetadata(RESPONSE_MESSAGE, message);
