import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { Role } from '@/types';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to role-appropriate home
    switch (user.role) {
      case 'PLAYER':
        return <Navigate to="/characters" replace />;
      case 'GAME_MASTER':
        return <Navigate to="/gm/teams" replace />;
      case 'ADMIN':
        return <Navigate to="/admin" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return <Outlet />;
}
