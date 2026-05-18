import { NavLink, useLocation } from 'react-router-dom';
import type { LayoutProps } from '../router';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useEffect } from 'react';
import { fetchDocuments } from '../store/thunks';

function sectionTitle(pathname: string) {
  if (pathname.startsWith('/documents/')) {
    return 'Редактор документа';
  }
  if (pathname.startsWith('/profile')) {
    return 'Профиль';
  }
  return 'Мои документы';
}

export function AppLayout({ children }: LayoutProps) {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const mockUser = useAppSelector((state) => state.auth.mockUser);

  useEffect(() => {
    void dispatch(fetchDocuments());
  }, [dispatch]);

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-eyebrow">TS Spreadsheet</span>
          <strong>Рабочее пространство</strong>
        </div>
        <nav className="sidebar-nav" aria-label="Основная навигация">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => (isActive ? 'sidebar-link sidebar-link-active' : 'sidebar-link')}
          >
            Документы
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) => (isActive ? 'sidebar-link sidebar-link-active' : 'sidebar-link')}
          >
            Профиль
          </NavLink>
        </nav>
      </aside>

      <div className="app-main">
        <header className="app-header">
          <div>
            <p className="app-header-eyebrow">{location.pathname}</p>
            <h1>{sectionTitle(location.pathname)}</h1>
          </div>
          <div className="profile-chip">
            <span>{mockUser?.name}</span>
          </div>
        </header>

        <main className="page-shell">{children}</main>
      </div>
    </div>
  );
}
