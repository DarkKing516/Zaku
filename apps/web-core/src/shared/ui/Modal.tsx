'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../utils/cn';

const FOCUSABLE = 'a[href], button:not(:disabled), textarea:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly icon?: ReactNode;
  readonly dismissible?: boolean;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
}

export function Modal({ open, onClose, title, icon, dismissible = true, children, footer }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const latest = useRef({ onClose, dismissible });
  useEffect(() => {
    latest.current = { onClose, dismissible };
  });

  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) {
      return;
    }
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusables = () => Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    (focusables()[0] ?? panel).focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (latest.current.dismissible) {
          latest.current.onClose();
        }
        return;
      }
      if (event.key !== 'Tab') {
        return;
      }
      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) {
        event.preventDefault();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && dismissible) {
          onClose();
        }
      }}
      className={cn('fixed inset-0 z-40 flex animate-fade-in items-center justify-center bg-white/40 p-4 backdrop-blur-md', dismissible && 'cursor-pointer')}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative w-full max-w-md animate-modal-in cursor-default overflow-hidden rounded-card border border-white/40 bg-white/95 p-10 text-center shadow-premium outline-none"
      >
        <div aria-hidden className="absolute -left-24 -top-24 size-64 animate-pulse rounded-full bg-primary-400/20 blur-3xl" />
        <div aria-hidden className="absolute -bottom-24 -right-24 size-64 animate-pulse rounded-full bg-secondary-500/20 blur-3xl" />
        <div className="relative z-10 flex flex-col items-center">
          {icon && <div className="mb-6 grid size-20 place-items-center rounded-[1.5rem] bg-primary-50 text-primary-600 shadow-sm">{icon}</div>}
          <h2 id={titleId} className="mb-2 text-2xl font-bold text-ink">
            {title}
          </h2>
          <div className="mb-8 px-2 text-base text-muted">{children}</div>
          {footer}
        </div>
      </div>
    </div>,
    document.body,
  );
}
