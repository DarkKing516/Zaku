import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { Observable, map } from 'rxjs';
import { RAW_RESPONSE } from './decorators/raw-response.decorator';
import { RESPONSE_MESSAGE } from './decorators/response-message.decorator';
import { buildSuccessEnvelope, currentRequestId } from './response-envelope';

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<unknown>): Observable<unknown> {
    const targets = [context.getHandler(), context.getClass()];
    if (context.getType() !== 'http' || this.reflector.getAllAndOverride<boolean>(RAW_RESPONSE, targets)) {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const message = this.reflector.getAllAndOverride<string | undefined>(RESPONSE_MESSAGE, targets);

    return next.handle().pipe(
      map((result) =>
        buildSuccessEnvelope({
          result,
          statusCode: response.statusCode,
          message,
          requestId: currentRequestId(request),
        }),
      ),
    );
  }
}
