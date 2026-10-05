import { inspect } from 'node:util';
import { Secret } from '@common/security/secret';

describe('Secret', () => {
  const password = Secret.of('super-secret-password');

  it('reveals the value only on explicit request', () => {
    expect(password.reveal()).toBe('super-secret-password');
  });

  it('never leaks through logging, string interpolation or serialization', () => {
    const command = { email: 'jane@example.com', password };

    expect(String(password)).toBe('[REDACTED]');
    expect(JSON.stringify(command)).toBe('{"email":"jane@example.com","password":"[REDACTED]"}');
    expect(inspect(command)).not.toContain('super-secret-password');
    expect(Object.keys(password)).toEqual([]);
  });
});
