import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageSpinner } from './ui/Spinner';

/**
 * ProtectedRoute: redirects unauthenticated users to /login.
 * If allowedRoles is provided, also enforces role-based access.
 */
export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <PageSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to their correct dashboard
    const roleRedirects = { admin: '/admin', user: '/user/stores', owner: '/owner' };
    return <Navigate to={roleRedirects[user?.role] || '/login'} replace />;
  }

  return children;
}
