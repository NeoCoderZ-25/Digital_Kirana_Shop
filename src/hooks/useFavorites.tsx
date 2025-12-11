import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export const useFavorites = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites([]);
      setLoading(false);
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('favorites')
      .select('product_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching favorites:', error);
    } else {
      setFavorites(data.map(f => f.product_id));
    }
    setLoading(false);
  };

  const toggleFavorite = async (productId: string) => {
    if (!user) {
      toast({
        title: 'Please sign in',
        description: 'You need to be signed in to add favorites.',
        variant: 'destructive',
      });
      return;
    }

    const isFavorite = favorites.includes(productId);

    if (isFavorite) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to remove from favorites.',
          variant: 'destructive',
        });
      } else {
        setFavorites(current => current.filter(id => id !== productId));
        toast({
          title: 'Removed from favorites',
          description: 'Product removed from your favorites.',
        });
      }
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, product_id: productId });

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to add to favorites.',
          variant: 'destructive',
        });
      } else {
        setFavorites(current => [...current, productId]);
        toast({
          title: 'Added to favorites',
          description: 'Product added to your favorites.',
        });
      }
    }
  };

  const isFavorite = (productId: string) => favorites.includes(productId);

  return { favorites, loading, toggleFavorite, isFavorite };
};
