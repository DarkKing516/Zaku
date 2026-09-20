'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { Modal, Button, Typography } from 'antd';
import { useRouter, usePathname } from 'next/navigation';
import UseSessionStore, { SessionReason } from '@/store/session/use-session-store';
import { Icon } from '@iconify/react';

const { Title, Text } = Typography;

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos
const CHECK_INTERVAL_MS = 60 * 1000; // Revisar cada 1 minuto

export default function SessionManager() {
  const { sessionState, openModal, closeModal } = UseSessionStore();
  const router = useRouter();
  const pathname = usePathname();
  const lastActivity = useRef<number>(Date.now());
  const inactivityInterval = useRef<NodeJS.Timeout | null>(null);

  const logoutAndRedirect = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Error cerrando sesión local:', e);
    }
    closeModal();
    router.push('/login');
  }, [closeModal, router]);

  const handleAccept = () => {
    if (sessionState.reason === 'EXPIRED' || sessionState.reason === 'INACTIVITY') {
      logoutAndRedirect();
    } else {
      closeModal();
    }
  };

  const updateActivity = useCallback(() => {
    lastActivity.current = Date.now();
  }, []);

  // Effect for checking inactivity
  useEffect(() => {
    if (pathname.startsWith('/login')) {
      if (inactivityInterval.current) clearInterval(inactivityInterval.current);
      return;
    }

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'visibilitychange'];
    events.forEach(event => window.addEventListener(event, updateActivity, { passive: true }));

    inactivityInterval.current = setInterval(() => {
      if (Date.now() - lastActivity.current > INACTIVITY_TIMEOUT_MS) {
        openModal('INACTIVITY', 'Tu sesión ha expirado por inactividad prolongada.');
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
      if (inactivityInterval.current) clearInterval(inactivityInterval.current);
    };
  }, [pathname, updateActivity, openModal]);

  // Effect for catching CustomEvents from api-request.ts
  useEffect(() => {
    const handleSessionError = async (e: Event) => {
      const customEvent = e as CustomEvent<{ reason: SessionReason; message?: string }>;
      const { reason, message } = customEvent.detail;

      if (reason === 'EXPIRED') {
        await fetch('/api/auth/logout', { method: 'POST' });
      }
      openModal(reason, message);
    };

    window.addEventListener('SESSION_ERROR', handleSessionError);
    return () => window.removeEventListener('SESSION_ERROR', handleSessionError);
  }, [openModal]);

  const getModalContent = () => {
    switch (sessionState.reason) {
      case 'EXPIRED':
        return {
          title: 'Sesión Expirada',
          icon: <Icon icon="line-md:account-delete" width="32" height="32" />,
          text: sessionState.message || 'Tu token de acceso ha vencido. Por favor, inicia sesión nuevamente para continuar.',
        };
      case 'INACTIVITY':
        return {
          title: 'Cierre por Inactividad',
          icon: <Icon icon="line-md:watch-twotone-loop" width="32" height="32" />,
          text: 'Llevas demasiado tiempo de inactividad. Por tu seguridad, hemos cerrado la sesión.',
        };
      case 'FORBIDDEN':
      default:
        return {
          title: 'Acceso Denegado',
          icon: <Icon icon="line-md:alert-circle-twotone-loop" width="32" height="32" />,
          text: sessionState.message || 'No tienes los permisos necesarios para realizar esta acción.',
        };
    }
  };

  const content = getModalContent();

  return (
    <Modal
      open={sessionState.isOpen}
      onCancel={sessionState.reason === 'FORBIDDEN' ? closeModal : undefined}
      closable={sessionState.reason === 'FORBIDDEN'}
      footer={null}
      centered
      className="premium-modal"
      styles={{
        mask: { backdropFilter: 'blur(12px)', backgroundColor: 'rgba(255, 255, 255, 0.4)' },
        content: { padding: 0, borderRadius: '2rem', overflow: 'hidden', border: 'none', background: 'transparent', boxShadow: 'none' },
      }}
    >
      <div className="relative overflow-hidden w-full h-full bg-white/95 backdrop-blur-3xl rounded-[2rem] p-10 flex flex-col items-center justify-center text-center shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-white/40 group">
        {/* Background Bubbles */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-secondary-500/20 rounded-full blur-3xl animate-pulse delay-700" />

        <div className="relative z-10 w-20 h-20 rounded-[1.5rem] bg-primary-50 text-primary-600 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500 ease-out">
          {content.icon}
        </div>

        <Title level={3} className="!mt-0 !mb-2 !text-zinc-800 relative z-10">
          {content.title}
        </Title>

        <Text className="text-zinc-500 text-base mb-8 px-2 relative z-10">
          {content.text}
        </Text>

        <Button
          type="primary"
          size="large"
          className="w-full h-12 text-base font-semibold rounded-[1rem] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all relative z-10 !bg-primary-600 hover:!bg-primary-500 !text-white !border-transparent"
          onClick={handleAccept}
        >
          {sessionState.reason === 'FORBIDDEN' ? 'Entendido' : 'Ir al Login'}
        </Button>
      </div>
    </Modal>
  );
}
