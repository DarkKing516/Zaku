import { House, Users } from 'lucide-react';
import type { NavIconName } from './navigation';

const icons = {
  home: House,
  users: Users,
} satisfies Record<NavIconName, unknown>;

export function NavIcon({ name, className }: { name: NavIconName; className?: string }) {
  const Icon = icons[name];
  return <Icon className={className} aria-hidden />;
}
