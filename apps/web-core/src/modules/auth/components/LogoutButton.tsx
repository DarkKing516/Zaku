'use client';

import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAppNavigation } from '@/shared/client/navigation';
import { toast } from '@/shared/client/toast';
import { LOGIN_ROUTE } from '@/shared/constants';
import { Button } from '@/shared/ui/Button';
import { authApi } from '../api';

export function LogoutButton() {
  const { goTo } = useAppNavigation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      await authApi.logout();
      goTo(LOGIN_ROUTE);
    } catch {
      setIsLoggingOut(false);
      toast.error('No pudimos cerrar tu sesión. Intenta de nuevo.');
    }
  };

  return (
    <Button variant="danger" size="sm" onClick={logout} loading={isLoggingOut}>
      {!isLoggingOut && <LogOut className="size-5" aria-hidden />}
      <span className="sr-only sm:not-sr-only">Cerrar sesión</span>
    </Button>
  );
}
