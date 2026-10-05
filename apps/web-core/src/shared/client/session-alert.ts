'use client';

import { create } from 'zustand';

export type SessionAlertReason = 'EXPIRED' | 'FORBIDDEN' | 'INACTIVITY';

interface SessionAlertState {
  reason: SessionAlertReason | null;
  message?: string;
  show: (reason: SessionAlertReason, message?: string) => void;
  dismiss: () => void;
}

export const useSessionAlertStore = create<SessionAlertState>((set) => ({
  reason: null,
  show: (reason, message) => set({ reason, message }),
  dismiss: () => set({ reason: null, message: undefined }),
}));

export const sessionAlert = {
  show: (reason: SessionAlertReason, message?: string) => useSessionAlertStore.getState().show(reason, message),
};
