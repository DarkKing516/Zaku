/** @jest-environment jsdom */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { SessionWatcher } from '@/modules/auth/components/SessionWatcher';
import { sessionAlert, useSessionAlertStore } from '@/shared/client/session-alert';

const mockLogout = jest.fn(async () => ({ loggedOut: true }));
const mockReplace = jest.fn();
jest.mock('@/modules/auth/api', () => ({ authApi: { logout: () => mockLogout() } }));
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: mockReplace, refresh: jest.fn() }) }));

describe('SessionWatcher', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useSessionAlertStore.getState().dismiss();
    mockLogout.mockClear();
    mockReplace.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing while the session is fine', () => {
    render(<SessionWatcher />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the session after ten minutes without activity', async () => {
    render(<SessionWatcher />);

    act(() => {
      jest.advanceTimersByTime(11 * 60 * 1000);
    });
    expect(screen.getByRole('dialog')).toHaveTextContent('Cierre por inactividad');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Ir al login' }));
    });
    expect(mockLogout).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('lets the user dismiss a forbidden alert and shows the server message', () => {
    render(<SessionWatcher />);

    act(() => {
      sessionAlert.show('FORBIDDEN', 'El tenant no está disponible');
    });
    expect(screen.getByRole('dialog')).toHaveTextContent('El tenant no está disponible');

    fireEvent.click(screen.getByRole('button', { name: 'Entendido' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockLogout).not.toHaveBeenCalled();
  });
});
