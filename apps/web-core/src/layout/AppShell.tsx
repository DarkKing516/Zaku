import type { ReactNode } from 'react';
import { LogoutButton } from '@/modules/auth/components/LogoutButton';
import { AppVersion } from './AppVersion';
import { BrandMark } from './BrandMark';
import { NavLink } from './NavLink';
import { NAV_ITEMS } from './navigation';
import { SidebarFrame } from './SidebarFrame';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-canvas">
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-primary-100/40 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-32 top-1/2 size-80 rounded-full bg-secondary-100/30 blur-[100px]" />

      <SidebarFrame
        brand={<BrandMark />}
        navigation={
          <nav aria-label="Principal">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.key} item={item} orientation="sidebar" />
            ))}
          </nav>
        }
        footer={<AppVersion />}
        actions={<LogoutButton />}
      >
        {children}
      </SidebarFrame>

      <nav aria-label="Principal (móvil)" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface md:hidden">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.key} item={item} orientation="bottom" />
        ))}
      </nav>
    </div>
  );
}
