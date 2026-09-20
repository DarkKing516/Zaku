'use client';

import React from 'react';
import { Provider } from 'jotai';
import SessionManager from '@/components/auth/SessionManager';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider>
      {children}
      <SessionManager />
    </Provider>
  );
}
