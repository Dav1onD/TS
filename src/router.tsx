import {
  BrowserRouter,
  MemoryRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom';
import type { ReactNode } from 'react';
import { AppLayout } from './routes/AppLayout';
import { DashboardPage } from './routes/DashboardPage';
import { NotFoundPage } from './routes/NotFoundPage';
import { ProfilePage } from './routes/ProfilePage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { SpreadsheetPage } from './routes/SpreadsheetPage';

type AppRouterProps = {
  initialEntries?: string[];
};

function RootRedirect() {
  return <Navigate to="/dashboard" replace />;
}

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </ProtectedRoute>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/documents/:documentId" element={<SpreadsheetPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export function AppRouter({ initialEntries }: AppRouterProps) {
  if (initialEntries) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <AppRoutes />
      </MemoryRouter>
    );
  }

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export type LayoutProps = {
  children: ReactNode;
};
