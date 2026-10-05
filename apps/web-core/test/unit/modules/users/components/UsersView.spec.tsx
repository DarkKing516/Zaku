/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { UsersView } from '@/modules/users/components/UsersView';

const pagination = (page: number, totalPages: number) => ({ page, pageSize: 10, totalItems: totalPages * 10, totalPages });

describe('UsersView', () => {
  it('lists the users with links to the neighbour pages', () => {
    render(<UsersView page={{ items: [{ id: 'user-1', email: 'demo@zaku.dev', createdAt: '2026-02-01T09:00:00.000Z' }], pagination: pagination(2, 3) }} />);

    expect(screen.getByRole('table')).toHaveTextContent('demo@zaku.dev');
    expect(screen.getByRole('link', { name: /Anterior/ })).toHaveAttribute('href', '/users?page=1');
    expect(screen.getByRole('link', { name: /Siguiente/ })).toHaveAttribute('href', '/users?page=3');
  });

  it('shows the empty state when the page has no users', () => {
    render(<UsersView page={{ items: [], pagination: pagination(5, 3) }} />);

    expect(screen.getByText('Sin usuarios en esta página')).toBeInTheDocument();
  });

  it('shows the safe error message from the server', () => {
    render(<UsersView errorMessage="El servicio no está disponible." />);

    expect(screen.getByRole('alert')).toHaveTextContent('El servicio no está disponible.');
  });
});
