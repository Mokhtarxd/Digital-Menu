import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AdminUser extends User {
  isAdmin?: boolean;
}

// Define the profiles table row type for user_type
interface ProfileRow {
  user_type: string;
}

export const useAdminAuth = () => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 10000); // 10 second timeout
    
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        if (session?.user) {
          const isAdmin = await checkAdminStatus(session.user);
          setUser({ ...session.user, isAdmin });
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        try {
          if (session?.user) {
            const isAdmin = await checkAdminStatus(session.user);
            setUser({ ...session.user, isAdmin });
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          setUser(null);
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const checkAdminStatus = async (user: User): Promise<boolean> => {
    if (!user.id) {
      return false;
    }
    
    try {
      // Check user_type in profiles table with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout')), 5000);
      });
      
      const queryPromise = supabase
        .from('profiles')
        .select('user_type, email')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
      
      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      
      if (!data) {
        return false;
      }
      
      const isAdmin = data?.user_type === 'admin';
      return isAdmin;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  const signInAdmin = async (email: string, password: string) => {
    console.log('=== Starting admin sign in ===');
    console.log('Email:', email);
    
    try {
      console.log('1. Attempting Supabase authentication...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Auth error:', error);
        throw error;
      }

      if (!data.user) {
        console.error('No user returned from auth');
        throw new Error('Authentication failed - no user returned');
      }

      console.log('2. Auth successful for user:', data.user.email);
      console.log('User ID:', data.user.id);

      console.log('3. Checking admin status...');
      
      // First, let's check if profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_type, email, full_name')
        .eq('user_id', data.user.id)
        .maybeSingle();

      console.log('Profile query result:', { profileData, profileError });

      if (profileError) {
        console.error('Profile query error:', profileError);
        await supabase.auth.signOut();
        throw new Error('Failed to verify user profile. Please try again.');
      }

      if (!profileData) {
        console.log('No profile found - this might be a new user');
        await supabase.auth.signOut();
        throw new Error('User profile not found. Please contact administrator.');
      }

      console.log('4. Profile found:', profileData);
      console.log('User type:', profileData.user_type);

      const isAdmin = profileData.user_type === 'admin';
      console.log('5. Is admin?', isAdmin);

      if (!isAdmin) {
        console.log('User is not admin, signing out...');
        await supabase.auth.signOut();
        throw new Error('Access denied. This user does not have admin privileges.');
      }

      console.log('6. Setting user as admin and completing sign in...');
      setUser({ ...data.user, isAdmin: true });
      console.log('=== Admin sign in completed successfully ===');

      return data;
    } catch (error) {
      console.error('=== Admin sign in failed ===');
      console.error('Error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  return {
    user,
    loading,
    signInAdmin,
    signOut,
    isAdmin: user?.isAdmin || false,
  };
};
