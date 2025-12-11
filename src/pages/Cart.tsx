import AppLayout from '@/components/layout/AppLayout';
import { ShoppingCart, Minus, Plus, Trash2, NotebookPen, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useCart } from '@/hooks/useCart';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const Cart = () => {
  const { items, updateQuantity, removeItem, totalPrice, orderNote, setOrderNote } = useCart();
  const [noteOpen, setNoteOpen] = useState(false);

  const deliveryCharge = totalPrice >= 499 ? 0 : 40;
  const finalTotal = totalPrice + deliveryCharge;

  if (items.length === 0) {
    return (
      <AppLayout>
        <div className="px-4 pt-6">
          <h1 className="text-2xl font-bold text-foreground mb-6">Your Cart</h1>
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <ShoppingCart className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground text-center mb-6">
              Looks like you haven't added anything to your cart yet.
            </p>
            <Button asChild>
              <Link to="/">Start Shopping</Link>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-32">
        <h1 className="text-2xl font-bold text-foreground mb-6">Your Cart ({items.length})</h1>

        {/* Cart Items */}
        <div className="space-y-3 mb-6">
          {items.map((item) => (
            <Card key={`${item.productId}-${item.variantId}`} className="animate-fade-in">
              <CardContent className="p-3">
                <div className="flex gap-3">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={item.imageUrl || '/placeholder.svg'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground line-clamp-1">{item.name}</h3>
                    {item.variantName && (
                      <p className="text-sm text-muted-foreground">{item.variantName}</p>
                    )}
                    <p className="text-lg font-bold text-foreground mt-1">₹{item.price}</p>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                          className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                          className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Notes */}
        <Collapsible open={noteOpen} onOpenChange={setNoteOpen} className="mb-6">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-card rounded-lg border border-border hover:bg-accent/10 transition-colors">
            <div className="flex items-center gap-2">
              <NotebookPen className={cn('w-5 h-5 text-primary', noteOpen && 'animate-wiggle')} />
              <span className="font-medium">Add Order Notes</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {orderNote ? 'Added' : 'Optional'}
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <Textarea
              placeholder="Any special instructions for your order? (e.g., 'Extra spicy', 'Call before delivery')"
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              className="min-h-[100px]"
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Delivery Info */}
        <div className="flex items-center gap-2 p-3 bg-success/10 rounded-lg mb-6">
          <Clock className="w-5 h-5 text-success" />
          <span className="text-sm text-success font-medium">
            {totalPrice >= 499
              ? 'Free delivery on this order!'
              : `Add ₹${499 - totalPrice} more for free delivery`}
          </span>
        </div>

        {/* Price Summary */}
        <Card className="mb-6">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">₹{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery</span>
              <span className={cn(deliveryCharge === 0 ? 'text-success' : 'text-foreground')}>
                {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
              </span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span>₹{finalTotal.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sticky Checkout Button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-background border-t border-border">
        <Button asChild className="w-full h-12 text-lg font-semibold animate-pulse-glow">
          <Link to="/checkout">Proceed to Checkout</Link>
        </Button>
      </div>
    </AppLayout>
  );
};

export default Cart;
