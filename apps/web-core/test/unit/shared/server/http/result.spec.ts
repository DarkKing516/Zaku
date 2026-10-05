import { fail, mapResult, ok } from '@/shared/server/http/result';

describe('Result', () => {
  it('keeps falsy data as a success', () => {
    expect(ok(0)).toEqual({ ok: true, data: 0 });
  });

  it('builds failures with a default code derived from the status', () => {
    expect(fail(404, 'Not found')).toEqual({ ok: false, error: { status: 404, code: 'HTTP_404', message: 'Not found', fields: undefined } });
  });

  it('maps successes and lets failures through untouched', () => {
    const failure = fail(503, 'Down', 'UNAVAILABLE');

    expect(mapResult(ok(2), (value) => value * 10)).toEqual(ok(20));
    expect(mapResult(failure, (value: number) => value * 10)).toBe(failure);
  });
});
