import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/layout/AppLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Sparkles, TrendingUp, Star } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'there';

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-muted-foreground text-sm">Welcome back,</p>
            <h1 className="text-2xl font-bold text-foreground">{username}!</h1>
          </div>
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-primary" />
          </div>
        </div>

        {/* AI Recommendations Section */}
        <section className="mb-8 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary animate-wiggle" />
            <h2 className="text-lg font-semibold text-foreground">Recommended For You</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {[1, 2, 3].map((i) => (
              <div key={i} className="min-w-[160px] space-y-2">
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </section>

        {/* Popular Products Section */}
        <section className="mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-foreground">Popular Products</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="min-w-[160px] space-y-2">
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </section>

        {/* Store Picks Section */}
        <section className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-foreground">Store Picks</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default Index;
