import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useLoyaltyPoints = () => {
  const [points, setPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPoints = async () => {
    if (!user?.id) {
      setPoints(0);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_user_points', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error fetching points:', error);
        setPoints(0);
      } else {
        setPoints(typeof data === 'number' ? data : 0);
      }
    } catch (error) {
      console.error('Error fetching points:', error);
      setPoints(0);
    } finally {
      setLoading(false);
    }
  };

  const redeemPoints = async (amount: number, reason: string, metadata?: any) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase.rpc('redeem_points', {
        p_user_id: user.id,
        amount: amount,
        reason: reason,
        metadata: metadata
      });

      if (error) {
        throw error;
      }

      const newPoints = typeof data === 'number' ? data : 0;
      setPoints(newPoints);
      return newPoints;
    } catch (error) {
      console.error('Error redeeming points:', error);
      throw error;
    }
  };

  const awardPoints = async (amount: number, reason: string, metadata?: any) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase.rpc('award_points', {
        p_user_id: user.id,
        amount: amount,
        reason: reason,
        metadata: metadata
      });

      if (error) {
        throw error;
      }

      const newPoints = typeof data === 'number' ? data : 0;
      setPoints(newPoints);
      return newPoints;
    } catch (error) {
      console.error('Error awarding points:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchPoints();
  }, [user?.id]);

  return {
    points,
    loading,
    redeemPoints,
    awardPoints,
    refreshPoints: fetchPoints
  };
};
