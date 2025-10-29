import { Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from '@/components/layout/AppShell';
import { AdminPage } from '@/pages/AdminPage';
import { AuthPage } from '@/pages/AuthPage';
import { BriefPage } from '@/pages/BriefPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ScorePage } from '@/pages/ScorePage';

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/brief" replace />} />
        <Route path="/brief" element={<BriefPage />} />
        <Route path="/score" element={<ScorePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}

export default App;
