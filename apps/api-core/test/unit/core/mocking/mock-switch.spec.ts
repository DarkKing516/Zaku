import { MockSwitch, parseMockSelectors } from '@core/mocking/mock-switch';
import { buildAppConfig } from '@test/support/app-config.fixture';
import { buildMockSwitch } from '@test/support/mock-switch.fixture';

function mockSwitchFor(adapters: string): MockSwitch {
  return buildMockSwitch(buildAppConfig({ mocks: { adapters, seedData: false } }));
}

describe('MockSwitch', () => {
  it('uses real adapters when nothing is selected', () => {
    expect(mockSwitchFor('').isMocked('users.repository')).toBe(false);
  });

  it('mocks everything with "*"', () => {
    expect(mockSwitchFor('*').isMocked('users.repository')).toBe(true);
  });

  it('mocks a whole module or a single port', () => {
    const mockSwitch = mockSwitchFor('tenants.*, users.repository');

    expect(mockSwitch.isMocked('tenants.repository')).toBe(true);
    expect(mockSwitch.isMocked('tenants.database-provisioner')).toBe(true);
    expect(mockSwitch.isMocked('users.repository')).toBe(true);
    expect(mockSwitch.isMocked('idempotency.store')).toBe(false);
  });

  it('fails fast on malformed selectors', () => {
    expect(() => parseMockSelectors('users')).toThrow(/Invalid MOCK_ADAPTERS/);
    expect(() => parseMockSelectors('Users.Repository')).toThrow(/Invalid MOCK_ADAPTERS/);
  });

  it('fails at construction when a selector matches no declared adapter', () => {
    expect(() => mockSwitchFor('user.*')).toThrow(/match no switchable adapter/);
    expect(() => mockSwitchFor('users.repo')).toThrow(/match no switchable adapter/);
  });

  it('rejects malformed adapter keys declared in code', () => {
    expect(() => mockSwitchFor('*').isMocked('repository')).toThrow(/Invalid adapter key/);
  });
});
