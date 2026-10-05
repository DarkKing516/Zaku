import { appEnvironment, parseEnvironment } from '@/shared/server/env';

const SECRET = 'a-session-secret-with-more-than-32-characters';

describe('parseEnvironment', () => {
  it('applies the defaults and coerces numeric variables', () => {
    const environment = parseEnvironment({ SESSION_SECRET: SECRET, MOCK_LATENCY_MS: '10' });

    expect(environment).toMatchObject({ NODE_ENV: 'development', SESSION_TTL_SECONDS: 28_800, MOCK_LATENCY_MS: 10, HTTP_TIMEOUT_MS: 15_000 });
  });

  it('treats empty variables as undefined so templates do not override defaults', () => {
    const environment = parseEnvironment({ SESSION_SECRET: SECRET, MOCK_LATENCY_MS: '', API_CORE_URL: '' });

    expect(environment.MOCK_LATENCY_MS).toBe(350);
    expect(environment.API_CORE_URL).toBeUndefined();
  });

  it('rejects a short session secret', () => {
    expect(() => parseEnvironment({ SESSION_SECRET: 'too-short' })).toThrow(/SESSION_SECRET/);
  });

  it('only accepts http(s) URLs for the API', () => {
    expect(() => parseEnvironment({ SESSION_SECRET: SECRET, API_CORE_URL: 'javascript:alert(1)' })).toThrow(/API_CORE_URL/);
    expect(parseEnvironment({ SESSION_SECRET: SECRET, API_CORE_URL: 'https://api.zaku.dev/api' }).API_CORE_URL).toBe('https://api.zaku.dev/api');
  });
});

describe('appEnvironment', () => {
  it.each([
    ['local', 'local'],
    ['prod', 'prod'],
    ['', undefined],
    ['staging', undefined],
  ])('maps %p to %p without demanding the runtime secrets', (rawValue, expected) => {
    expect(appEnvironment(rawValue)).toBe(expected);
  });

  it('reads APP_ENV from the process by default', () => {
    expect(appEnvironment()).toBe('local');
  });
});
