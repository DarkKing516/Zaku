import { mock } from '@/shared/server/http/mock';
import { fail, ok } from '@/shared/server/http/result';

describe('mock', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns exactly what the simulated API produced, success or failure', async () => {
    await expect(mock('Core.users.list', () => ok([1, 2]))).resolves.toEqual(ok([1, 2]));
    await expect(mock('Core.users.list', () => fail(503, 'Down'))).resolves.toEqual(fail(503, 'Down'));
  });

  it('logs which simulated call answered', async () => {
    await mock('Core.user-auth.login', () => fail(401, 'Nope'));

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[mock] Core.user-auth.login -> error 401'));
  });

  it('waits MOCK_LATENCY_MS before answering so loading states are visible', async () => {
    const previousLatency = process.env.MOCK_LATENCY_MS;
    process.env.MOCK_LATENCY_MS = '40';
    try {
      await jest.isolateModulesAsync(async () => {
        const isolated = await import('@/shared/server/http/mock');
        const startedAt = Date.now();

        await isolated.mock('Core.users.list', () => ok(null));

        expect(Date.now() - startedAt).toBeGreaterThanOrEqual(35);
      });
    } finally {
      process.env.MOCK_LATENCY_MS = previousLatency;
    }
  });
});
