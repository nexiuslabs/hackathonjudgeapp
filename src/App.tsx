import { Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/routing/ProtectedRoute';
import { AdminEventProvider } from '@/contexts/AdminEventContext';
import { AuthPage } from '@/pages/AuthPage';
import { BriefPage } from '@/pages/BriefPage';
import { RankingsPage } from '@/pages/RankingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ScorePage } from '@/pages/ScorePage';
import { AdminPage } from '@/pages/AdminPage';
import { AdminAccessDenied } from '@/pages/AdminAccessDenied';
import { ADMIN_ROLES } from '@/types/permissions';

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/brief" replace />} />
        <Route path="/brief" element={<BriefPage />} />
        <Route path="/score" element={<ScorePage />} />
        <Route path="/rankings" element={<RankingsPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute
              allowedRoles={ADMIN_ROLES}
              fallback={<AdminAccessDenied />}
              loadingFallback={
                <div className="flex min-h-[40vh] items-center justify-center rounded-3xl border border-dashed border-surface-border/60 bg-surface-base/60 text-sm text-neutral-300">
                  Verifying admin access…
                </div>
              }
            >
              {(permissions) => (
                <AdminEventProvider eventId={permissions.eventId ?? undefined}>
                  <AdminPage />
                </AdminEventProvider>
              )}
            </ProtectedRoute>
          }
        />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}

export default App;
