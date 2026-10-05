'use client';

import { Clock, ShieldAlert, UserX } from 'lucide-react';
import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useAppNavigation } from '@/shared/client/navigation';
import { useSessionAlertStore, type SessionAlertReason } from '@/shared/client/session-alert';
import { LOGIN_ROUTE } from '@/shared/constants';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';
import { authApi } from '../api';

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;
const INACTIVITY_CHECK_INTERVAL_MS = 60 * 1000;
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'scroll', 'click', 'visibilitychange'] as const;

const ALERT_CONTENT: Record<SessionAlertReason, { title: string; icon: ReactNode; text: string; action: string }> = {
  EXPIRED: {
    title: 'Sesión expirada',
    icon: <UserX className="size-8" aria-hidden />,
    text: 'Tu sesión venció. Inicia sesión nuevamente para continuar.',
    action: 'Ir al login',
  },
  INACTIVITY: {
    title: 'Cierre por inactividad',
    icon: <Clock className="size-8" aria-hidden />,
    text: 'Llevas demasiado tiempo de inactividad. Por tu seguridad, cerramos la sesión.',
    action: 'Ir al login',
  },
  FORBIDDEN: {
    title: 'Acceso denegado',
    icon: <ShieldAlert className="size-8" aria-hidden />,
    text: 'No tienes los permisos necesarios para realizar esta acción.',
    action: 'Entendido',
  },
};

export function SessionWatcher() {
  const { goTo } = useAppNavigation();
  const reason = useSessionAlertStore((state) => state.reason);
  const message = useSessionAlertStore((state) => state.message);
  const show = useSessionAlertStore((state) => state.show);
  const dismiss = useSessionAlertStore((state) => state.dismiss);
  const lastActivityAt = useRef(0);

  useEffect(() => {
    const markActivity = () => {
      lastActivityAt.current = Date.now();
    };
    markActivity();
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, markActivity, { passive: true }));
    const interval = setInterval(() => {
      if (Date.now() - lastActivityAt.current > INACTIVITY_TIMEOUT_MS) {
        show('INACTIVITY');
      }
    }, INACTIVITY_CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, markActivity));
      clearInterval(interval);
    };
  }, [show]);

  const endSession = useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    dismiss();
    goTo(LOGIN_ROUTE);
  }, [dismiss, goTo]);

  if (!reason) {
    return null;
  }

  const content = ALERT_CONTENT[reason];
  const isForbidden = reason === 'FORBIDDEN';
  const onAccept = isForbidden ? dismiss : () => void endSession();

  return (
    <Modal
      open
      title={content.title}
      icon={content.icon}
      dismissible={isForbidden}
      onClose={dismiss}
      footer={
        <Button size="lg" className="w-full" onClick={onAccept}>
          {content.action}
        </Button>
      }
    >
      {isForbidden && message ? message : content.text}
    </Modal>
  );
}
