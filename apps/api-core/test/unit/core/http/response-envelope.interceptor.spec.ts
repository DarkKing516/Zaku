import { CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { firstValueFrom, of } from 'rxjs';
import { RawResponse } from '@core/http/decorators/raw-response.decorator';
import { ResponseMessage } from '@core/http/decorators/response-message.decorator';
import { ResponseEnvelopeInterceptor } from '@core/http/response-envelope.interceptor';
import { fakeRequest, fakeResponse, httpExecutionContext } from '@test/support/http-execution-context';

class EnvelopedController {
  @ResponseMessage('Created on purpose')
  create(): void {}

  @RawResponse()
  download(): void {}
}

@RawResponse()
class RawController {
  stream(): void {}
}

describe('ResponseEnvelopeInterceptor', () => {
  const interceptor = new ResponseEnvelopeInterceptor(new Reflector());
  const returning = (body: unknown): CallHandler<unknown> => ({ handle: () => of(body) });

  function run(controller: abstract new () => object, handler: () => void, statusCode = 200) {
    const context = httpExecutionContext(fakeRequest(), controller, handler, fakeResponse(statusCode));
    return firstValueFrom(interceptor.intercept(context, returning({ id: 1 })));
  }

  it('wraps results using the status code and the custom message of the route', async () => {
    await expect(run(EnvelopedController, EnvelopedController.prototype.create, 201)).resolves.toMatchObject({
      success: true,
      statusCode: 201,
      message: 'Created on purpose',
      data: { id: 1 },
    });
  });

  it.each([
    ['a method', EnvelopedController, EnvelopedController.prototype.download],
    ['a whole controller', RawController, RawController.prototype.stream],
  ])('leaves responses untouched when @RawResponse is applied to %s', async (_case, controller, handler) => {
    await expect(run(controller, handler)).resolves.toEqual({ id: 1 });
  });
});
