import { InjectionToken, Provider, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { assertAdapterKey, MockSwitch } from './mock-switch';
import { SwitchableAdapterKeys } from './switchable-adapter-keys';

export interface SwitchableAdapterDefinition<TPort> {
  readonly provide: InjectionToken;
  readonly key: string;
  readonly real: Type<TPort>;
  readonly mock: Type<TPort>;
}

export function provideSwitchableAdapter<TPort>(definition: SwitchableAdapterDefinition<TPort>): Provider<TPort> {
  assertAdapterKey(definition.key);
  SwitchableAdapterKeys.declare(definition.key);

  return {
    provide: definition.provide,
    inject: [MockSwitch, ModuleRef],
    useFactory: (mockSwitch: MockSwitch, moduleRef: ModuleRef): Promise<TPort> =>
      moduleRef.create(mockSwitch.isMocked(definition.key) ? definition.mock : definition.real),
  };
}
