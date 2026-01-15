import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useDeliveryBoy = () => {
  const { user, loading: authLoading } = useAuth();
  const [isDeliveryBoy, setIsDeliveryBoy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkDeliveryBoyRole = async () => {
      if (!user) {
        setIsDeliveryBoy(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'delivery_boy'
        });

        if (error) {
          console.error('Error checking delivery_boy role:', error);
          setIsDeliveryBoy(false);
        } else {
          setIsDeliveryBoy(data === true);
        }
      } catch (err) {
        console.error('Error:', err);
        setIsDeliveryBoy(false);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkDeliveryBoyRole();
    }
  }, [user, authLoading]);

  return { isDeliveryBoy, loading: loading || authLoading };
};
