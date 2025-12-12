import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Clock, 
  Package, 
  Truck, 
  CheckCircle, 
  MapPin, 
  Phone, 
  CreditCard,
  ShoppingBag,
  MessageSquare,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

interface OrderDetail {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  total_price: number;
  payment_method: string;
  payment_status: string;
  address: { 
    label: string; 
    address: string;
    phone?: string;
    city?: string;
    state?: string;
    pincode?: string;
  } | null;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: { name: string; image_url: string } | null;
    variant: { name: string } | null;
  }>;
  notes: { user_note: string | null; admin_reply: string | null } | null;
}

const statusSteps = [
  { 
    key: 'pending', 
    label: 'Order Placed', 
    description: 'Your order has been received',
    icon: ShoppingBag,
    color: 'text-primary'
  },
  { 
    key: 'confirmed', 
    label: 'Order Confirmed', 
    description: 'Seller has confirmed your order',
    icon: CheckCircle,
    color: 'text-success'
  },
  { 
    key: 'processing', 
    label: 'Processing', 
    description: 'Your order is being prepared',
    icon: Package,
    color: 'text-accent'
  },
  { 
    key: 'out_for_delivery', 
    label: 'Out for Delivery', 
    description: 'Your order is on its way',
    icon: Truck,
    color: 'text-primary'
  },
  { 
    key: 'delivered', 
    label: 'Delivered', 
    description: 'Your order has been delivered',
    icon: CheckCircle,
    color: 'text-success'
  },
];

const OrderTracking = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user && id) {
      fetchOrder();
      // Subscribe to real-time updates
      const channel = supabase
        .channel(`order-${id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${id}`
          },
          (payload) => {
            setOrder(prev => prev ? { ...prev, ...payload.new } : prev);
            toast({ title: 'Order Updated', description: 'Your order status has been updated' });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, id]);

  const fetchOrder = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        address:addresses(label, address, phone, city, state, pincode),
        items:order_items(
          id,
          quantity,
          price,
          product:products(name, image_url),
          variant:product_variants(name)
        ),
        notes:order_notes(user_note, admin_reply)
      `)
      .eq('id', id)
      .eq('user_id', user?.id)
      .single();

    if (error) {
      console.error('Error fetching order:', error);
      navigate('/orders');
    } else {
      setOrder(data);
    }
    setLoading(false);
  };

  const getStatusIndex = (status: string) => {
    const index = statusSteps.findIndex(s => s.key === status);
    return index === -1 ? 0 : index;
  };

  const copyOrderId = async () => {
    if (order) {
      await navigator.clipboard.writeText(order.id);
      setCopied(true);
      toast({ title: 'Copied!', description: 'Order ID copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getEstimatedDelivery = () => {
    if (!order) return null;
    const orderDate = new Date(order.created_at);
    const estimatedDate = new Date(orderDate);
    
    switch (order.status) {
      case 'delivered':
        return 'Delivered';
      case 'out_for_delivery':
        return 'Today';
      case 'processing':
        estimatedDate.setDate(estimatedDate.getDate() + 1);
        return format(estimatedDate, 'dd MMM');
      default:
        estimatedDate.setDate(estimatedDate.getDate() + 2);
        return format(estimatedDate, 'dd MMM');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!order) {
    return (
      <AppLayout>
        <div className="px-4 pt-6 text-center">
          <p className="text-muted-foreground">Order not found</p>
          <Button onClick={() => navigate('/orders')} className="mt-4">
            View All Orders
          </Button>
        </div>
      </AppLayout>
    );
  }

  const currentStep = getStatusIndex(order.status);
  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Order Tracking</h1>
            <button 
              onClick={copyOrderId}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              #{order.id.slice(0, 8).toUpperCase()}
              {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Estimated Delivery Banner */}
        {!isCancelled && (
          <Card className={cn(
            'mb-6 border-2',
            isDelivered ? 'border-success bg-success/5' : 'border-primary bg-primary/5'
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isDelivered ? 'Delivered on' : 'Estimated Delivery'}
                  </p>
                  <p className={cn(
                    'text-2xl font-bold',
                    isDelivered ? 'text-success' : 'text-primary'
                  )}>
                    {getEstimatedDelivery()}
                  </p>
                </div>
                <div className={cn(
                  'w-14 h-14 rounded-2xl flex items-center justify-center',
                  isDelivered ? 'bg-success/20' : 'bg-primary/20'
                )}>
                  {isDelivered ? (
                    <CheckCircle className="w-8 h-8 text-success" />
                  ) : (
                    <Truck className="w-8 h-8 text-primary" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cancelled Banner */}
        {isCancelled && (
          <Card className="mb-6 border-2 border-destructive bg-destructive/5">
            <CardContent className="p-4 text-center">
              <p className="text-destructive font-semibold">Order Cancelled</p>
              <p className="text-sm text-muted-foreground">This order has been cancelled</p>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        {!isCancelled && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="relative pl-8">
                {/* Timeline line */}
                <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-border" />
                
                {statusSteps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isCompleted = index <= currentStep;
                  const isCurrent = index === currentStep;
                  
                  // Generate estimated time for each step
                  const orderDate = new Date(order.created_at);
                  const stepDate = new Date(orderDate);
                  stepDate.setHours(stepDate.getHours() + index * 6);
                  
                  return (
                    <div key={step.key} className={cn(
                      'relative pb-6 last:pb-0',
                      !isCompleted && 'opacity-50'
                    )}>
                      {/* Icon */}
                      <div className={cn(
                        'absolute -left-8 w-6 h-6 rounded-full flex items-center justify-center',
                        isCompleted 
                          ? isCurrent 
                            ? 'bg-primary animate-pulse' 
                            : 'bg-success' 
                          : 'bg-muted'
                      )}>
                        <StepIcon className={cn(
                          'w-3 h-3',
                          isCompleted ? 'text-primary-foreground' : 'text-muted-foreground'
                        )} />
                      </div>
                      
                      {/* Content */}
                      <div className="ml-4">
                        <div className="flex items-center justify-between">
                          <p className={cn(
                            'font-semibold',
                            isCompleted ? 'text-foreground' : 'text-muted-foreground'
                          )}>
                            {step.label}
                          </p>
                          {isCompleted && index <= currentStep && (
                            <span className="text-xs text-muted-foreground">
                              {index === currentStep 
                                ? formatDistanceToNow(new Date(order.updated_at), { addSuffix: true })
                                : format(stepDate, 'dd MMM, h:mm a')
                              }
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                        
                        {/* Current step animation */}
                        {isCurrent && !isDelivered && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-xs text-primary font-medium">In Progress</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Items */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Order Items ({order.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={item.product?.image_url || '/placeholder.svg'} 
                    alt={item.product?.name} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{item.product?.name}</p>
                  {item.variant && (
                    <p className="text-xs text-muted-foreground">{item.variant.name}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold text-foreground">₹{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Delivery Address */}
        {order.address && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                <p className="font-medium text-foreground">{order.address.label}</p>
                {order.address.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-3 h-3" />
                    +91 {order.address.phone}
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  {order.address.address}
                  {order.address.city && `, ${order.address.city}`}
                  {order.address.state && `, ${order.address.state}`}
                  {order.address.pincode && ` - ${order.address.pincode}`}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Details */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Method</span>
              <span className="text-foreground capitalize">
                {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Status</span>
              <span className={cn(
                'capitalize font-medium',
                order.payment_status === 'paid' ? 'text-success' : 'text-accent'
              )}>
                {order.payment_status === 'pending_verification' ? 'Verifying' : order.payment_status}
              </span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-bold">
              <span>Total Amount</span>
              <span className="text-lg">₹{order.total_price.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Order Notes */}
        {order.notes && (order.notes.user_note || order.notes.admin_reply) && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Order Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {order.notes.user_note && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Your Note</p>
                  <p className="text-sm text-foreground">{order.notes.user_note}</p>
                </div>
              )}
              {order.notes.admin_reply && (
                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-xs text-primary font-medium mb-1">Store Reply</p>
                  <p className="text-sm text-foreground">{order.notes.admin_reply}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Order Info */}
        <div className="text-center text-xs text-muted-foreground">
          <p>Ordered on {format(new Date(order.created_at), 'dd MMMM yyyy, h:mm a')}</p>
          <p>Last updated {formatDistanceToNow(new Date(order.updated_at), { addSuffix: true })}</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default OrderTracking;