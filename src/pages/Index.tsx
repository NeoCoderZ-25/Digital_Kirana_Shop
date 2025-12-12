import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProducts, useCategories, useFeaturedProducts, usePopularProducts } from '@/hooks/useProducts';
import AppLayout from '@/components/layout/AppLayout';
import { SearchBar } from '@/components/SearchBar';
import { DealBanner } from '@/components/DealBanner';
import { CategoryPills } from '@/components/CategoryPills';
import { ProductCard } from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, TrendingUp, Star, ShoppingBag, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { user, session } = useAuth();
  const { t } = useLanguage();
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'there';
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(true);
  
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: featuredProducts, isLoading: featuredLoading } = useFeaturedProducts();
  const { data: popularProducts, isLoading: popularLoading } = usePopularProducts();

  // Fetch AI recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!session?.access_token) {
        setAiLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-recommendations`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.productIds && products) {
            const recommended = data.productIds
              .map((id: string) => products.find(p => p.id === id))
              .filter(Boolean);
            setAiRecommendations(recommended);
          }
        }
      } catch (error) {
        console.error('Failed to fetch AI recommendations:', error);
      } finally {
        setAiLoading(false);
      }
    };

    if (products && products.length > 0) {
      fetchRecommendations();
    }
  }, [session, products]);

  // Filter products based on search and category
  const filteredProducts = products?.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const ProductSkeleton = () => (
    <div className="min-w-[160px] space-y-2">
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <div>
            <p className="text-muted-foreground text-sm">{t('hello')},</p>
            <h1 className="text-2xl font-bold text-foreground">{username}!</h1>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
            <ShoppingBag className="w-6 h-6 text-primary-foreground" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 animate-fade-in" style={{ animationDelay: '50ms' }}>
          <SearchBar 
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('searchProducts')}
          />
        </div>

        {/* Deal Banners */}
        <div className="mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <DealBanner />
        </div>

        {/* Category Pills */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: '150ms' }}>
          <CategoryPills
            categories={categories || []}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            loading={categoriesLoading}
          />
        </div>

        {/* AI Recommendations Section */}
        {!searchQuery && !selectedCategory && (
          <section className="mb-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground">{t('recommendedForYou')}</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {aiLoading || productsLoading ? (
                [1, 2, 3].map((i) => <ProductSkeleton key={i} />)
              ) : aiRecommendations.length > 0 ? (
                aiRecommendations.map((product) => (
                  <div key={product.id} className="min-w-[160px]">
                    <ProductCard product={product} compact />
                  </div>
                ))
              ) : (
                // Fallback to popular products if no AI recommendations
                popularProducts?.slice(0, 4).map((product) => (
                  <div key={product.id} className="min-w-[160px]">
                    <ProductCard product={product} compact />
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* Popular Products Section */}
        {!searchQuery && !selectedCategory && (
          <section className="mb-8 animate-fade-in" style={{ animationDelay: '250ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl">
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </div>
              <h2 className="text-lg font-bold text-foreground">{t('popularProducts')}</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {popularLoading ? (
                [1, 2, 3, 4].map((i) => <ProductSkeleton key={i} />)
              ) : (
                popularProducts?.map((product) => (
                  <div key={product.id} className="min-w-[160px]">
                    <ProductCard product={product} compact />
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* Featured/Store Picks Section */}
        {!searchQuery && !selectedCategory && (
          <section className="mb-8 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-xl">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <h2 className="text-lg font-bold text-foreground">{t('storePicks')}</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {featuredLoading ? (
                [1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-40 w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))
              ) : (
                featuredProducts?.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              )}
            </div>
          </section>
        )}

        {/* All Products / Search Results */}
        <section className="animate-fade-in" style={{ animationDelay: '350ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              {searchQuery || selectedCategory ? `${filteredProducts?.length || 0} ${t('items')}` : t('allProducts')}
            </h2>
          </div>
          
          {productsLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-40 w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredProducts && filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{searchQuery ? 'No products found' : 'No products available'}</p>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
};

export default Index;
