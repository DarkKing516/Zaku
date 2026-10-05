'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/utils/cn';
import { NavIcon } from './NavIcon';
import type { NavItem } from './navigation';

const orientationClasses = {
  sidebar: {
    base: 'my-2 flex items-center gap-3 rounded-xl px-4 py-3 text-sm group-data-[collapsed=true]/sidebar:justify-center',
    active: 'bg-primary-50 font-bold text-primary-600 shadow-[0_4px_12px_rgb(124_58_237/0.08)]',
    idle: 'font-medium text-muted hover:bg-black/[0.02] hover:text-primary-600',
    label: 'group-data-[collapsed=true]/sidebar:sr-only',
  },
  bottom: {
    base: 'flex flex-1 flex-col items-center justify-center gap-1 px-2 py-2.5 text-xs font-bold',
    active: 'text-primary-600',
    idle: 'text-muted hover:text-primary-600',
    label: '',
  },
};

export function NavLink({ item, orientation }: { item: NavItem; orientation: keyof typeof orientationClasses }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const classes = orientationClasses[orientation];

  return (
    <Link
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      title={item.label}
      className={cn('cursor-pointer transition-all duration-300', classes.base, isActive ? classes.active : classes.idle)}
    >
      <NavIcon name={item.icon} className="size-5 shrink-0" />
      <span className={classes.label}>{item.label}</span>
    </Link>
  );
}
