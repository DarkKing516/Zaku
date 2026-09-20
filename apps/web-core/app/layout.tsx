import '@/css/light-globals.css';
import type { Metadata } from 'next';
import React from 'react';
import Providers from '@/components/providers/Providers';
import { AppEnvBadge } from '@/components/core/AppEnvBadge';

export const metadata: Metadata = {
  title: 'Zaku Enterprise Platform',
  description: 'Enterprise multi-tenant platform',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="bg-zinc-50 text-zinc-900" suppressHydrationWarning={true}>
        <Providers>
          {children}
          <AppEnvBadge />
        </Providers>
      </body>
    </html>
  );
}
