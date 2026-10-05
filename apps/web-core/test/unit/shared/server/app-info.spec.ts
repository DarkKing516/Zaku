import packageJson from '../../../../package.json';
import { getAppInfo } from '@/shared/server/app-info';
import { withEnvironment } from '@test/support/environment';

describe('getAppInfo', () => {
  it('exposes the package version and a readable environment label', () => {
    expect(getAppInfo()).toEqual({ version: packageJson.version, environment: 'Local' });
  });

  it.each(['prod', undefined])('hides the environment label when APP_ENV is %p', (appEnvironment) => {
    withEnvironment({ APP_ENV: appEnvironment }, () => {
      expect(getAppInfo().environment).toBeNull();
    });
  });
});
