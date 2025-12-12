import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return;

    try {
      new Notification(title, {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        ...options,
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, [permission]);

  // Subscribe to order status updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          const oldStatus = payload.old?.status;

          if (newStatus !== oldStatus) {
            const statusMessages: Record<string, string> = {
              confirmed: '🎉 Your order has been confirmed!',
              preparing: '👨‍🍳 Your order is being prepared',
              out_for_delivery: '🚚 Your order is out for delivery!',
              delivered: '✅ Your order has been delivered!',
              cancelled: '❌ Your order has been cancelled',
            };

            const message = statusMessages[newStatus] || `Order status: ${newStatus}`;

            // Show in-app toast
            toast({
              title: 'Order Update',
              description: message,
            });

            // Show browser notification
            if (permission === 'granted') {
              showNotification('ShopEase Order Update', {
                body: message,
                tag: `order-${payload.new.id}`,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, permission, showNotification, toast]);

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
  };
};
