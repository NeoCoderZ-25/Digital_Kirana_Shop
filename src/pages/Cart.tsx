import AppLayout from '@/components/layout/AppLayout';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Cart = () => {
  return (
    <AppLayout>
      <div className="px-4 pt-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">Your Cart</h1>
        
        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <ShoppingCart className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground text-center mb-6">
            Looks like you haven't added anything to your cart yet.
          </p>
          <Button asChild>
            <a href="/">Start Shopping</a>
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Cart;
