import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Package, Home, ShoppingBag, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Delay content to show animation
    const timer = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-24 min-h-[80vh] flex flex-col items-center justify-center">
        {/* Animated Checkmark */}
        <div className="relative mb-8">
          <div className={cn(
            'w-24 h-24 rounded-full bg-success/20 flex items-center justify-center transition-all duration-700',
            showContent ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
          )}>
            <CheckCircle className={cn(
              'w-16 h-16 text-success transition-all duration-500 delay-300',
              showContent ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            )} />
          </div>
          {/* Ripple effect */}
          <div className="absolute inset-0 rounded-full bg-success/10 animate-ping" />
        </div>

        {/* Success Message */}
        <div className={cn(
          'text-center transition-all duration-500 delay-500',
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}>
          <h1 className="text-2xl font-bold text-foreground mb-2">Order Placed!</h1>
          <p className="text-muted-foreground">
            Thank you for your order. We'll notify you when it's on the way.
          </p>
        </div>

        {/* Order Details Card */}
        <Card className={cn(
          'w-full max-w-sm mt-8 transition-all duration-500 delay-700',
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}>
          <CardContent className="p-6">
            {orderId && (
              <div className="text-center mb-4 pb-4 border-b border-border">
                <p className="text-xs text-muted-foreground">Order ID</p>
                <p className="font-mono text-sm text-foreground">{orderId.slice(0, 8).toUpperCase()}</p>
              </div>
            )}

            {/* Delivery Timeline */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                  <Package className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Order Confirmed</p>
                  <p className="text-xs text-muted-foreground">Just now</p>
                </div>
              </div>

              <div className="ml-5 w-0.5 h-6 bg-border" />

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Truck className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-muted-foreground text-sm">Estimated Delivery</p>
                  <p className="text-xs text-muted-foreground">Within 24-48 hours</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className={cn(
          'w-full max-w-sm mt-8 space-y-3 transition-all duration-500 delay-1000',
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}>
          <Button 
            onClick={() => navigate('/orders')} 
            className="w-full h-12 text-base"
          >
            <Package className="w-5 h-5 mr-2" />
            View My Orders
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')} 
            className="w-full h-12 text-base"
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            Continue Shopping
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default OrderConfirmation;