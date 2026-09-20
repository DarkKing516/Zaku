import { atom, useAtom } from 'jotai';

export type SessionReason = 'EXPIRED' | 'FORBIDDEN' | 'INACTIVITY' | null;

export interface SessionStoreState {
  isOpen: boolean;
  reason: SessionReason;
  message?: string;
}

const sessionModalState = atom<SessionStoreState>({
  isOpen: false,
  reason: null,
  message: '',
});

export default function UseSessionStore() {
  const [sessionState, setSessionState] = useAtom(sessionModalState);

  const openModal = (reason: SessionReason, message?: string) => {
    setSessionState({ isOpen: true, reason, message });
  };

  const closeModal = () => {
    setSessionState({ isOpen: false, reason: null, message: '' });
  };

  return { sessionState, openModal, closeModal };
}
