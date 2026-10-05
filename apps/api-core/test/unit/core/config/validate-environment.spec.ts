import { RuntimeEnvironment } from '@core/config/environment-variables';
import { validateEnvironment } from '@core/config/validate-environment';
import { DEVELOPMENT_ENVIRONMENT, PRODUCTION_ENVIRONMENT } from '@test/support/environment.fixture';

describe('validateEnvironment', () => {
  it('applies defaults and converts numeric and boolean variables', () => {
    const environment = validateEnvironment({ ...DEVELOPMENT_ENVIRONMENT, PORT: '4000', MOCK_SEED_DATA: 'true' });

    expect(environment).toMatchObject({
      NODE_ENV: RuntimeEnvironment.Development,
      PORT: 4000,
      MOCK_SEED_DATA: true,
      DATABASE_SSL: false,
      CONTROL_DATABASE_NAME: 'zaku_control',
    });
  });

  it('drops variables that are not part of the schema', () => {
    expect(validateEnvironment({ ...DEVELOPMENT_ENVIRONMENT, UNRELATED: 'x' })).not.toHaveProperty('UNRELATED');
  });

  it('requires an explicit runtime environment so production rules cannot be skipped by omission', () => {
    expect(() => validateEnvironment({ JWT_SECRET: 'a-sufficiently-long-secret' })).toThrow(/NODE_ENV/);
  });

  it('fails fast when the JWT secret is missing', () => {
    expect(() => validateEnvironment({ NODE_ENV: 'development' })).toThrow(/JWT_SECRET/);
  });

  it('rejects out of range values', () => {
    expect(() => validateEnvironment({ ...DEVELOPMENT_ENVIRONMENT, PORT: '70000' })).toThrow(/PORT/);
    expect(() => validateEnvironment({ ...DEVELOPMENT_ENVIRONMENT, TENANT_DATABASE_POOL_MAX: '500' })).toThrow(
      /TENANT_DATABASE_POOL_MAX/,
    );
  });

  it('accepts a hardened production configuration and disables nothing silently', () => {
    expect(validateEnvironment(PRODUCTION_ENVIRONMENT).NODE_ENV).toBe(RuntimeEnvironment.Production);
  });

  it.each([
    [{ MOCK_ADAPTERS: '*' }, /MOCK_ADAPTERS must be empty/],
    [{ MOCK_SEED_DATA: 'true' }, /MOCK_SEED_DATA must be false/],
    [{ JWT_SECRET: 'only-sixteen-chars!' }, /at least 32 characters/],
    [{ DATABASE_PASSWORD: 'postgres' }, /development default/],
  ])('rejects unsafe production setting %p', (override, message) => {
    expect(() => validateEnvironment({ ...PRODUCTION_ENVIRONMENT, ...override })).toThrow(message);
  });
});
