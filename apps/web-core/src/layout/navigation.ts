export type NavIconName = 'home' | 'users';

export interface NavItem {
  readonly key: string;
  readonly label: string;
  readonly href: string;
  readonly icon: NavIconName;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { key: 'home', label: 'Inicio', href: '/home', icon: 'home' },
  { key: 'users', label: 'Usuarios', href: '/users', icon: 'users' },
];
