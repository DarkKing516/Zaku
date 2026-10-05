import { AppConfig, parseTrustProxy } from '@core/config/app-config';
import { validateEnvironment } from '@core/config/validate-environment';
import { DEVELOPMENT_ENVIRONMENT, PRODUCTION_ENVIRONMENT } from '@test/support/environment.fixture';

describe('parseTrustProxy', () => {
  it.each([
    ['', false],
    ['false', false],
    ['true', true],
    ['1', 1],
    [' 2 ', 2],
    ['loopback', 'loopback'],
    ['10.0.0.0/8, 172.16.0.0/12', '10.0.0.0/8, 172.16.0.0/12'],
  ])('maps %p to the Express "trust proxy" value %p', (rawValue, expected) => {
    expect(parseTrustProxy(rawValue)).toEqual(expected);
  });
});

describe('AppConfig.fromEnvironment', () => {
  it('publishes Swagger UI and the Scalar reference by default outside production', () => {
    const config = AppConfig.fromEnvironment(validateEnvironment(DEVELOPMENT_ENVIRONMENT));

    expect(config).toMatchObject({ swaggerEnabled: true, scalarEnabled: true });
  });

  it('hides both API documentation UIs by default in production', () => {
    const config = AppConfig.fromEnvironment(validateEnvironment(PRODUCTION_ENVIRONMENT));

    expect(config).toMatchObject({ swaggerEnabled: false, scalarEnabled: false });
  });

  it('toggles each API documentation UI independently', () => {
    const config = AppConfig.fromEnvironment(
      validateEnvironment({ ...DEVELOPMENT_ENVIRONMENT, SWAGGER_ENABLED: 'false', SCALAR_ENABLED: 'true' }),
    );

    expect(config).toMatchObject({ swaggerEnabled: false, scalarEnabled: true });
  });
});
