import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const AuthRedirectHandler = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAdminAndRedirect = async () => {
      if (loading || !user) return;
      
      try {
        // Check if user is admin
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();

        const isAdmin = profileData && (profileData as any).user_type === 'admin';

        if (isAdmin) {
          // Admin user - redirect based on current location
          if (!location.pathname.startsWith('/admin')) {
            // Admin is on customer pages, redirect to admin dashboard
            navigate('/admin/dashboard', { replace: true });
            return;
          }
        } else {
          // Regular user - block access to admin pages (handled by AdminRoute)
          // No action needed here as AdminRoute handles this
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdminAndRedirect();
  }, [user, loading, navigate, location.pathname]);

  return <>{children}</>;
};
