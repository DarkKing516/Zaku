import { BadRequestException, Logger, NotFoundException, PayloadTooLargeException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { AppError } from '@common/errors/app-error';
import { describeFailure, GlobalExceptionFilter } from '@core/http/global-exception.filter';
import { RequestValidationError } from '@core/http/request-validation.errors';
import { fakeRequest, fakeResponse, httpExecutionContext } from '@test/support/http-execution-context';

class SampleConflictError extends AppError {
  constructor() {
    super({ code: 'SAMPLE_CONFLICT', category: 'CONFLICT', message: 'Sample conflict', cause: new Error('db detail') });
  }
}

describe('describeFailure', () => {
  it('maps application errors by category and keeps their stable code', () => {
    expect(describeFailure(new SampleConflictError())).toEqual({
      statusCode: 409,
      code: 'SAMPLE_CONFLICT',
      message: 'Sample conflict',
      details: [],
    });
  });

  it('exposes validation details', () => {
    const failure = describeFailure(new RequestValidationError([{ field: 'email', message: 'email must be an email' }]));

    expect(failure).toMatchObject({ statusCode: 400, code: 'VALIDATION_FAILED' });
    expect(failure.details).toEqual([{ field: 'email', message: 'email must be an email' }]);
  });

  it('derives a code from the status of framework HTTP exceptions', () => {
    expect(describeFailure(new NotFoundException('Cannot GET /x'))).toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
      message: 'Cannot GET /x',
    });
    expect(describeFailure(new PayloadTooLargeException())).toMatchObject({ statusCode: 413, code: 'PAYLOAD_TOO_LARGE' });
  });

  it('turns multi-message HTTP exceptions into details', () => {
    const failure = describeFailure(new BadRequestException(['first problem', 'second problem']));

    expect(failure.details).toEqual([{ message: 'first problem' }, { message: 'second problem' }]);
  });

  it('keeps the status of client errors raised by Express middleware such as body-parser', () => {
    const payloadTooLarge = Object.assign(new Error('request entity too large'), {
      status: 413,
      statusCode: 413,
      expose: true,
      type: 'entity.too.large',
    });

    expect(describeFailure(payloadTooLarge)).toEqual({
      statusCode: 413,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'request entity too large',
      details: [],
    });
  });

  it('does not trust middleware errors that are not marked as exposable', () => {
    const internal = Object.assign(new Error('socket hang up'), { status: 400, expose: false });

    expect(describeFailure(internal)).toMatchObject({ statusCode: 500, code: 'INTERNAL_ERROR' });
  });

  it.each([
    ['statement timeout', new QueryFailedError('SELECT', [], Object.assign(new Error('canceling statement'), { code: '57014' }))],
    ['connection lost', new QueryFailedError('SELECT', [], Object.assign(new Error('terminated'), { code: '08006' }))],
    ['pool exhausted', new Error('timeout exceeded when trying to connect')],
    ['server refused', Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' })],
  ])('reports a transient database failure (%s) as 503 DATABASE_UNAVAILABLE', (_case, error) => {
    expect(describeFailure(error)).toMatchObject({ statusCode: 503, code: 'DATABASE_UNAVAILABLE' });
  });

  it('does not hide programming errors in SQL behind a 503', () => {
    const missingTable = new QueryFailedError('SELECT', [], Object.assign(new Error('relation does not exist'), { code: '42P01' }));

    expect(describeFailure(missingTable)).toMatchObject({ statusCode: 500, code: 'INTERNAL_ERROR' });
  });

  it('hides unexpected errors behind a generic 500', () => {
    expect(describeFailure(new TypeError('secret internals'))).toEqual({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: [],
    });
    expect(describeFailure('thrown string')).toMatchObject({ statusCode: 500 });
  });
});

describe('GlobalExceptionFilter', () => {
  class SampleController {
    handle(): void {}
  }

  let errorLog: jest.SpyInstance;

  beforeEach(() => {
    errorLog = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    errorLog.mockRestore();
  });

  function catchWith(exception: unknown, response = fakeResponse()) {
    const request = fakeRequest({ method: 'GET', routePath: '/api/v1/resources' });
    new GlobalExceptionFilter().catch(exception, httpExecutionContext(request, SampleController, SampleController.prototype.handle, response));
    return response;
  }

  it('answers with the error envelope and logs server errors with their cause chain', () => {
    const response = catchWith(new Error('outer failure', { cause: new Error('root cause') }));

    expect(response.statusCode).toBe(500);
    expect(response.body).toMatchObject({
      success: false,
      statusCode: 500,
      error: { code: 'INTERNAL_ERROR' },
      meta: { path: '/api/v1/resources' },
    });
    expect(errorLog).toHaveBeenCalledWith(
      expect.stringMatching(/^\[[^\]]+\] GET \/api\/v1\/resources failed$/),
      expect.stringMatching(/outer failure[\s\S]*Caused by: Error: root cause/),
    );
  });

  it('logs values thrown without an Error wrapper', () => {
    catchWith('plain string failure');

    expect(errorLog).toHaveBeenCalledWith(expect.any(String), "'plain string failure'");
  });

  it('does not log expected client errors', () => {
    const response = catchWith(new SampleConflictError());

    expect(response.statusCode).toBe(409);
    expect(errorLog).not.toHaveBeenCalled();
  });

  it('only logs when the response has already started', () => {
    const response = catchWith(new Error('late failure'), fakeResponse(200, { headersSent: true }));

    expect(errorLog).toHaveBeenCalledTimes(1);
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeUndefined();
  });
});
