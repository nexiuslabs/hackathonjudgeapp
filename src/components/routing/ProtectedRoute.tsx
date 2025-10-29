import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { usePermissions, type UsePermissionsResult } from '@/hooks/usePermissions';
import type { PermissionRole } from '@/types/permissions';

const defaultLoadingState = (
  <div className="flex min-h-[40vh] items-center justify-center rounded-3xl border border-dashed border-surface-border/60 bg-surface-base/60 text-sm text-neutral-300">
    Checking permissions…
  </div>
);

interface ProtectedRouteProps {
  allowedRoles: PermissionRole[];
  children: ReactNode | ((permissions: UsePermissionsResult) => ReactNode);
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
  redirectTo?: string;
}

function hasAccess(permissions: UsePermissionsResult, allowedRoles: PermissionRole[]): boolean {
  const { role } = permissions;
  if (!role) {
    return false;
  }

  return allowedRoles.includes(role);
}

export function ProtectedRoute({
  allowedRoles,
  children,
  fallback,
  loadingFallback,
  redirectTo = '/auth',
}: ProtectedRouteProps) {
  const location = useLocation();
  const permissions = usePermissions();

  if (permissions.isLoading) {
    return <>{loadingFallback ?? defaultLoadingState}</>;
  }

  if (!hasAccess(permissions, allowedRoles)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Navigate
        to={redirectTo}
        replace
        state={{
          from: location.pathname,
          reason: 'forbidden',
        }}
      />
    );
  }

  const content = typeof children === 'function' ? children(permissions) : children;

  return <>{content}</>;
}
