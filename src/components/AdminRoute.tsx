import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface AdminRouteProps {
  children: ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading } = useAdminAuth();
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setTimeoutReached(true);
    }, 8000); // 8 second timeout

    return () => clearTimeout(timeout);
  }, []);

  if (loading && !timeoutReached) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If timeout reached and still loading, redirect to login
  if (timeoutReached && loading) {
    return <Navigate to="/admin/login?error=timeout" replace />;
  }

  if (!user || !user.isAdmin) {
    return <Navigate to="/admin?error=unauthorized" replace />;
  }

  return <>{children}</>;
};
