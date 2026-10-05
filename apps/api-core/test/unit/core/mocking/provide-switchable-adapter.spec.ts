import { Global, Injectable, Module, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppConfig } from '@core/config/app-config';
import { MockSwitch } from '@core/mocking/mock-switch';
import { provideSwitchableAdapter } from '@core/mocking/provide-switchable-adapter';
import { buildAppConfig } from '@test/support/app-config.fixture';

const GREETER = Symbol('GREETER');

interface GreeterPort {
  greet(): string;
}

const lifecycle: string[] = [];

@Injectable()
class GreetingPrefix {
  readonly value = 'hello from';
}

@Injectable()
class RealGreeter implements GreeterPort, OnModuleInit, OnApplicationShutdown {
  constructor(private readonly prefix: GreetingPrefix) {
    lifecycle.push('real:constructed');
  }

  greet(): string {
    return `${this.prefix.value} real`;
  }

  onModuleInit(): void {
    lifecycle.push('real:init');
  }

  onApplicationShutdown(): void {
    lifecycle.push('real:shutdown');
  }
}

@Injectable()
class MockGreeter implements GreeterPort, OnModuleInit, OnApplicationShutdown {
  constructor() {
    lifecycle.push('mock:constructed');
  }

  greet(): string {
    return 'hello from mock';
  }

  onModuleInit(): void {
    lifecycle.push('mock:init');
  }

  onApplicationShutdown(): void {
    lifecycle.push('mock:shutdown');
  }
}

async function bootGreeterModule(mockAdapters: string): Promise<string> {
  @Module({
    providers: [
      GreetingPrefix,
      provideSwitchableAdapter<GreeterPort>({ provide: GREETER, key: 'greeting.greeter', real: RealGreeter, mock: MockGreeter }),
    ],
  })
  class GreetingModule {}

  @Global()
  @Module({
    providers: [{ provide: AppConfig, useValue: buildAppConfig({ mocks: { adapters: mockAdapters, seedData: false } }) }, MockSwitch],
    exports: [AppConfig, MockSwitch],
  })
  class MockingTestModule {}

  const moduleRef = await Test.createTestingModule({ imports: [MockingTestModule, GreetingModule] }).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  await app.init();
  const greeting = app.get<GreeterPort>(GREETER).greet();
  await app.close();
  return greeting;
}

describe('provideSwitchableAdapter', () => {
  beforeEach(() => {
    lifecycle.length = 0;
  });

  it('instantiates only the real adapter, with its dependencies and lifecycle hooks run once', async () => {
    await expect(bootGreeterModule('')).resolves.toBe('hello from real');

    expect(lifecycle).toEqual(['real:constructed', 'real:init', 'real:shutdown']);
  });

  it('instantiates only the mock adapter when its key is selected', async () => {
    await expect(bootGreeterModule('greeting.*')).resolves.toBe('hello from mock');

    expect(lifecycle).toEqual(['mock:constructed', 'mock:init', 'mock:shutdown']);
  });

  it('refuses to boot when a selector matches no declared adapter', async () => {
    await expect(bootGreeterModule('gretting.*')).rejects.toThrow(/match no switchable adapter/);
  });
});
