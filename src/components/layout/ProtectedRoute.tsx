import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { Role } from '@/types';
import { getRoleRedirect, normalizeRole } from '@/lib/ao-utils';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const role = normalizeRole(user.role);
  if (!role) {
    console.warn('[auth] Protected route blocked unknown role', { role: user.role });
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    console.warn('[auth] Protected route role mismatch', {
      currentRole: role,
      allowedRoles,
      redirectTo: getRoleRedirect(role),
    });
    return <Navigate to={getRoleRedirect(role)} replace />;
  }

  return <Outlet />;
}
