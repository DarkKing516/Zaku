import 'server-only';
import type { Env } from '../env';

export const apis = [
  {
    name: 'Core',
    urlEnv: 'API_CORE_URL',
    controllers: [
      { name: 'user-auth', actions: [{ endpoint: 'login', version: 'v1' }] },
      { name: 'users', actions: [{ endpoint: '', version: 'v1' }] },
    ],
  },
] as const satisfies readonly ApiDefinition[];

export type ApiVersion = 'v1' | '';

interface ApiDefinition {
  readonly name: string;
  readonly urlEnv: keyof Env;
  readonly controllers: readonly {
    readonly name: string;
    readonly actions: readonly { readonly endpoint: string; readonly version: ApiVersion }[];
  }[];
}

export type ApiName = (typeof apis)[number]['name'];
