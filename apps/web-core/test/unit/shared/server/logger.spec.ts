import { logger, redact } from '@/shared/server/logger';

describe('redact', () => {
  it('hides sensitive keys at any depth, including inside arrays', () => {
    expect(
      redact({ email: 'demo@zaku.dev', password: 'secret', nested: { accessToken: 'jwt', items: [{ authorization: 'Bearer x', id: 1 }] } }),
    ).toEqual({ email: 'demo@zaku.dev', password: '[REDACTED]', nested: { accessToken: '[REDACTED]', items: [{ authorization: '[REDACTED]', id: 1 }] } });
  });

  it('leaves primitives untouched', () => {
    expect(redact('plain')).toBe('plain');
    expect(redact(null)).toBeNull();
  });
});

describe('logger', () => {
  it('writes errors to stderr with the scope and redacted metadata', () => {
    const errorSink = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    logger.error('http', 'failed', { token: 'abc' });

    expect(errorSink).toHaveBeenCalledWith(expect.stringMatching(/ERROR \[http\] failed$/), { token: '[REDACTED]' });
    errorSink.mockRestore();
  });
});
