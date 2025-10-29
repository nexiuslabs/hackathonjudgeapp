import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import type { UsePermissionsResult } from '@/hooks/usePermissions';
import { ProtectedRoute } from '@/components/routing/ProtectedRoute';

const usePermissionsMock = vi.hoisted(() => vi.fn<[], UsePermissionsResult>());

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => usePermissionsMock(),
}));

const basePermissions: UsePermissionsResult = {
  role: 'admin',
  eventId: 'demo-event',
  email: 'ops@example.com',
  fullName: 'Operations Lead',
  source: 'supabase',
  canAccessAdmin: true,
  isLoading: false,
  error: null,
  refresh: vi.fn(),
};

describe('ProtectedRoute', () => {
  it('renders children when the user has an allowed role', () => {
    usePermissionsMock.mockReturnValue(basePermissions);

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <ProtectedRoute allowedRoles={['admin']}>
          <div>Admin content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(screen.getByText('Admin content')).toBeInTheDocument();
  });

  it('renders the fallback when the user lacks permission', () => {
    usePermissionsMock.mockReturnValue({
      ...basePermissions,
      role: 'judge',
      canAccessAdmin: false,
    });

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <ProtectedRoute allowedRoles={['admin']} fallback={<div>Access denied</div>}>
          <div>Admin content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(screen.getByText('Access denied')).toBeInTheDocument();
  });

  it('redirects to the auth page when no fallback is provided', () => {
    usePermissionsMock.mockReturnValue({
      ...basePermissions,
      role: null,
      canAccessAdmin: false,
    });

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <div>Secret</div>
              </ProtectedRoute>
            }
          />
          <Route path="/auth" element={<div>Auth portal</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Auth portal')).toBeInTheDocument();
  });
});
