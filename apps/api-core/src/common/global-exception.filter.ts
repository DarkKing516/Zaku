import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(statusCode).json({
      success: false,
      error: {
        code: exception instanceof HttpException ? exception.constructor.name : 'INTERNAL_ERROR',
        message: exception instanceof HttpException ? exception.message : 'Internal Server Error',
        statusCode,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
