import type { ReactNode } from 'react';
import { useAppSelector } from '../store/hooks';

type ProtectedRouteProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const mockUser = useAppSelector((state) => state.auth.mockUser);

  if (!mockUser) {
    return <div className="loading-screen">Требуется авторизация</div>;
  }

  return <>{children}</>;
}
