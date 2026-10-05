import { DEFAULT_ROUTE } from '@/shared/constants';
import { safeRedirectPath } from '@/shared/utils/safe-redirect';

describe('safeRedirectPath', () => {
  it('keeps internal paths, including their query string', () => {
    expect(safeRedirectPath('/users?page=2')).toBe('/users?page=2');
  });

  it.each([undefined, null, '', 'https://evil.example', '//evil.example', '/\\evil.example', 'users'])('falls back to the default route for %p', (target) => {
    expect(safeRedirectPath(target)).toBe(DEFAULT_ROUTE);
  });
});
