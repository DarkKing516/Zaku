import 'server-only';
import type { SessionUser } from '../types';
import type { LoginResponse } from './contracts';

export interface EstablishedSession {
  readonly user: SessionUser;
  readonly accessToken: string;
  readonly expiresAt: number;
}

export function toEstablishedSession(response: LoginResponse, now = Date.now()): EstablishedSession {
  return {
    user: { id: response.user.id, email: response.user.email, tenantId: response.user.tenantId },
    accessToken: response.accessToken,
    expiresAt: now + response.expiresIn * 1000,
  };
}
