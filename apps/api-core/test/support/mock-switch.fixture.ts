import { AppConfig } from '@core/config/app-config';
import { IdempotencyAdapterKeys } from '@core/idempotency/idempotency-adapter-keys';
import { MockSwitch } from '@core/mocking/mock-switch';
import { SwitchableAdapterKeys } from '@core/mocking/switchable-adapter-keys';
import { TenantsAdapterKeys } from '@modules/tenants/infrastructure/tenants-adapter-keys';
import { UsersAdapterKeys } from '@modules/users/infrastructure/users-adapter-keys';

const APPLICATION_ADAPTER_KEYS = [
  ...Object.values(TenantsAdapterKeys),
  ...Object.values(UsersAdapterKeys),
  ...Object.values(IdempotencyAdapterKeys),
];

export function buildMockSwitch(config: AppConfig): MockSwitch {
  APPLICATION_ADAPTER_KEYS.forEach((adapterKey) => SwitchableAdapterKeys.declare(adapterKey));
  return new MockSwitch(config);
}
