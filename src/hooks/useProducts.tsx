import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_featured: boolean | null;
  in_stock: boolean | null;
  order_count: number | null;
  category_id: string | null;
  category?: { id: string; name: string };
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  name: string;
  extra_price: number | null;
  in_stock: boolean | null;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
}

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          variants:product_variants(id, name, extra_price, in_stock)
        `)
        .eq('in_stock', true)
        .order('order_count', { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Category[];
    },
  });
};

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          variants:product_variants(id, name, extra_price, in_stock)
        `)
        .eq('is_featured', true)
        .eq('in_stock', true)
        .limit(6);

      if (error) throw error;
      return data as Product[];
    },
  });
};

export const usePopularProducts = () => {
  return useQuery({
    queryKey: ['popular-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          variants:product_variants(id, name, extra_price, in_stock)
        `)
        .eq('in_stock', true)
        .order('order_count', { ascending: false })
        .limit(6);

      if (error) throw error;
      return data as Product[];
    },
  });
};
