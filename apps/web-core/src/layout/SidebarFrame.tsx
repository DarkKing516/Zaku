'use client';

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Button } from '@/shared/ui/Button';

interface SidebarFrameProps {
  readonly brand: ReactNode;
  readonly navigation: ReactNode;
  readonly footer: ReactNode;
  readonly actions: ReactNode;
  readonly children: ReactNode;
}

export function SidebarFrame({ brand, navigation, footer, actions, children }: SidebarFrameProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="relative z-10 flex min-h-dvh">
      <aside
        data-collapsed={isCollapsed}
        className="group/sidebar hidden shrink-0 flex-col border-r border-black/5 px-4 transition-[width] duration-300 data-[collapsed=false]:w-[280px] data-[collapsed=true]:w-24 md:flex"
      >
        <div className="flex justify-center py-8">{brand}</div>
        <div className="flex-1">{navigation}</div>
        <div className="py-6 text-center text-[10px] text-muted group-data-[collapsed=true]/sidebar:sr-only">{footer}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[72px] items-center justify-between border-b border-black/5 bg-white/70 px-6 backdrop-blur-md">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed((current) => !current)}
            aria-label={isCollapsed ? 'Expandir menú' : 'Contraer menú'}
            className="hidden size-12 rounded-xl px-0 md:inline-flex"
          >
            {isCollapsed ? <PanelLeftOpen className="size-5" aria-hidden /> : <PanelLeftClose className="size-5" aria-hidden />}
          </Button>
          <div className="ml-auto">{actions}</div>
        </header>
        <main className="m-4 mb-24 flex-1 rounded-card border border-black/[0.03] bg-white p-5 shadow-soft sm:m-6 sm:p-8 md:mb-6">{children}</main>
      </div>
    </div>
  );
}
