import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { APP_DESCRIPTION, APP_NAME } from '@/shared/constants';
import { Toaster } from '@/shared/ui/Toaster';
import './globals.css';

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_DESCRIPTION,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
