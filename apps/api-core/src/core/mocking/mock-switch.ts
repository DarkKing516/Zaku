import { Injectable, Logger } from '@nestjs/common';
import { AppConfig } from '../config/app-config';
import { SwitchableAdapterKeys } from './switchable-adapter-keys';

const MOCK_ALL_ADAPTERS = '*';
const ADAPTER_KEY_PATTERN = /^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/;
const MODULE_WILDCARD_PATTERN = /^[a-z][a-z0-9-]*\.\*$/;

export function parseMockSelectors(rawSelectors: string): readonly string[] {
  const selectors = rawSelectors
    .split(',')
    .map((selector) => selector.trim())
    .filter((selector) => selector !== '');

  const invalidSelectors = selectors.filter(
    (selector) =>
      selector !== MOCK_ALL_ADAPTERS && !ADAPTER_KEY_PATTERN.test(selector) && !MODULE_WILDCARD_PATTERN.test(selector),
  );
  if (invalidSelectors.length > 0) {
    throw new Error(
      `Invalid MOCK_ADAPTERS selectors: ${invalidSelectors.join(', ')}. Use "*", "<module>.*" or "<module>.<port>"`,
    );
  }
  return selectors;
}

export function assertAdapterKey(adapterKey: string): void {
  if (!ADAPTER_KEY_PATTERN.test(adapterKey)) {
    throw new Error(`Invalid adapter key "${adapterKey}". Expected "<module>.<port>"`);
  }
}

function selectorMatches(selector: string, adapterKey: string): boolean {
  return selector === MOCK_ALL_ADAPTERS || selector === adapterKey || selector === `${adapterKey.split('.')[0]}.*`;
}

@Injectable()
export class MockSwitch {
  private readonly logger = new Logger(MockSwitch.name);
  private readonly selectors: readonly string[];

  constructor(config: AppConfig) {
    this.selectors = parseMockSelectors(config.mocks.adapters);
    this.assertSelectorsMatchDeclaredAdapters();
  }

  isMocked(adapterKey: string): boolean {
    assertAdapterKey(adapterKey);
    return this.selectors.some((selector) => selectorMatches(selector, adapterKey));
  }

  private assertSelectorsMatchDeclaredAdapters(): void {
    const declaredKeys = SwitchableAdapterKeys.declared();
    const unmatchedSelectors = this.selectors.filter(
      (selector) => !declaredKeys.some((adapterKey) => selectorMatches(selector, adapterKey)),
    );
    if (unmatchedSelectors.length > 0) {
      throw new Error(
        `MOCK_ADAPTERS selectors match no switchable adapter: ${unmatchedSelectors.join(', ')}. ` +
          `Known adapters: ${declaredKeys.join(', ')}`,
      );
    }
    const mockedKeys = declaredKeys.filter((adapterKey) => this.isMocked(adapterKey));
    if (mockedKeys.length > 0) {
      this.logger.warn(`Using MOCK adapters for: ${mockedKeys.join(', ')}`);
    }
  }
}
