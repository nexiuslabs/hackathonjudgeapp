import { useSearchParams } from 'react-router-dom';

import { ProtectedRoute } from '@/components/routing/ProtectedRoute';
import { ADMIN_ROLES } from '@/types/permissions';

import { TimerDisplayPage } from './TimerDisplayPage';

const accessDenied = (
  <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-surface-border/60 bg-surface-base/70 px-6 py-8 text-center text-sm text-neutral-200">
    <p className="text-base font-semibold text-white">Timer access restricted</p>
    <p className="text-sm text-neutral-300">
      You need admin, head judge, or operations permissions to manage the central timer. Use a shared link or request elevated access.
    </p>
  </div>
);

export function TimerRoute() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  if (token) {
    return <TimerDisplayPage />;
  }

  return (
    <ProtectedRoute allowedRoles={ADMIN_ROLES} fallback={accessDenied}>
      <TimerDisplayPage />
    </ProtectedRoute>
  );
}
