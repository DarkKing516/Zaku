import { loginSchema } from '@/modules/auth/schemas';

describe('loginSchema', () => {
  it('normalizes the tenant id and the email', () => {
    const parsed = loginSchema.parse({ tenantId: ' 00000000-0000-4000-8000-00000000000A ', email: ' Demo@Zaku.dev ', password: 'secret' });

    expect(parsed).toEqual({ tenantId: '00000000-0000-4000-8000-00000000000a', email: 'demo@zaku.dev', password: 'secret' });
  });

  it('reports every invalid field with a message for the form', () => {
    const result = loginSchema.safeParse({ tenantId: 'acme', email: 'not-an-email', password: '' });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => [issue.path.join('.'), issue.message])).toEqual([
      ['tenantId', 'Ingresa un ID de organización válido'],
      ['email', 'Ingresa un correo válido'],
      ['password', 'Ingresa tu contraseña'],
    ]);
  });
});
