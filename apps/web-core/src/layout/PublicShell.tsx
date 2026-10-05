import type { ReactNode } from 'react';
import { BackgroundBubbles } from '@/shared/ui/BackgroundBubbles';
import { AppVersion } from './AppVersion';

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-canvas">
      <BackgroundBubbles />
      <main className="relative flex flex-1 items-center justify-center p-4">{children}</main>
      <footer className="relative flex flex-col items-center gap-1 pb-6 text-xs font-bold uppercase tracking-widest text-muted/80">
        <span>Powered by Zaku</span>
        <AppVersion className="text-[10px] font-medium normal-case tracking-normal" />
      </footer>
    </div>
  );
}
