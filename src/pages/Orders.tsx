import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, Package, Truck, CheckCircle, Clock, RefreshCw, ChevronRight, ShoppingBag, XCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

interface Order {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  total_price: number;
  payment_method: string;
  payment_status: string;
  address: { label: string; address: string } | null;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: { name: string; image_url: string } | null;
  }>;
  notes: { user_note: string | null; admin_reply: string | null } | null;
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  pending: { label: 'Order Placed', icon: Clock, color: 'text-accent', bg: 'bg-accent/20' },
  confirmed: { label: 'Confirmed', icon: CheckCircle, color: 'text-success', bg: 'bg-success/20' },
  processing: { label: 'Processing', icon: Package, color: 'text-primary', bg: 'bg-primary/20' },
  out_for_delivery: { label: 'On the Way', icon: Truck, color: 'text-primary', bg: 'bg-primary/20' },
  delivered: { label: 'Delivered', icon: CheckCircle, color: 'text-success', bg: 'bg-success/20' },
  cancelled: { label: 'Cancelled', icon: Clock, color: 'text-destructive', bg: 'bg-destructive/20' },
};

const statusSteps = ['pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered'];

const Orders = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ongoing');
  const { user } = useAuth();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();

      // Subscribe to real-time order updates
      const channel = supabase
        .channel('orders-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
            toast({ title: 'Order Updated', description: `Order status changed to ${payload.new.status}` });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        address:addresses(label, address),
        items:order_items(
          id,
          quantity,
          price,
          product:products(name, image_url)
        ),
        notes:order_notes(user_note, admin_reply)
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const getStatusProgress = (status: string) => {
    const index = statusSteps.indexOf(status);
    return index === -1 ? 0 : ((index + 1) / statusSteps.length) * 100;
  };

  const handleReorder = (order: Order) => {
    order.items.forEach(item => {
      if (item.product) {
        addItem({
          productId: item.id,
          name: item.product.name,
          price: item.price,
          imageUrl: item.product.image_url,
        });
      }
    });
    toast({ title: 'Items added to cart', description: 'You can now proceed to checkout.' });
  };

  const handleCancelOrder = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)
      .eq('user_id', user?.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to cancel order', variant: 'destructive' });
    } else {
      toast({ title: 'Order Cancelled', description: 'Your order has been cancelled successfully' });
      fetchOrders();
    }
  };

  const canCancelOrder = (status: string) => {
    return ['pending', 'confirmed', 'processing'].includes(status);
  };

  const ongoingOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const completedOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

  const OrderCard = ({ order }: { order: Order }) => {
    const status = statusConfig[order.status] || statusConfig.pending;
    const StatusIcon = status.icon;
    const isCompleted = order.status === 'delivered';
    const isCancelled = order.status === 'cancelled';
    const progress = getStatusProgress(order.status);

    return (
      <Card 
        className="animate-fade-in cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => navigate(`/order/${order.id}`)}
      >
        <CardContent className="p-4">
          {/* Header with Status */}
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-medium text-foreground">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
              </p>
            </div>
            <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', status.bg, status.color)}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </div>
          </div>

          {/* Items Preview */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex -space-x-2">
              {order.items.slice(0, 3).map((item, i) => (
                <div 
                  key={item.id} 
                  className="w-10 h-10 rounded-lg overflow-hidden bg-muted border-2 border-background"
                  style={{ zIndex: 3 - i }}
                >
                  <img
                    src={item.product?.image_url || '/placeholder.svg'}
                    alt={item.product?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground truncate">
                {order.items.length} item{order.items.length > 1 ? 's' : ''}
              </p>
            </div>
            <p className="font-bold text-foreground">₹{order.total_price.toFixed(0)}</p>
          </div>

          {/* Progress Bar for Ongoing Orders */}
          {!isCancelled && !isCompleted && (
            <div className="mb-3">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>Placed</span>
                <span>Confirmed</span>
                <span>Processing</span>
                <span>Delivery</span>
                <span>Done</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-success rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Admin Reply Indicator */}
          {order.notes?.admin_reply && (
            <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 rounded-lg px-2 py-1.5 mb-3">
              <ShoppingBag className="w-3 h-3" />
              <span>Store replied to your note</span>
            </div>
          )}

          {/* Track / Reorder / Cancel Buttons */}
          <div className="flex gap-2">
            <Button 
              variant={isCompleted ? 'outline' : 'default'}
              size="sm" 
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/order/${order.id}`);
              }}
            >
              {isCompleted || isCancelled ? 'View Details' : 'Track Order'}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            {isCompleted && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReorder(order);
                }}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
            {canCancelOrder(order.status) && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel this order? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Order</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleCancelOrder(order.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Cancel Order
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
        <ClipboardList className="w-10 h-10 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2">No orders</h2>
      <p className="text-muted-foreground text-center mb-4">{message}</p>
      <Button onClick={() => navigate('/')} variant="outline">
        Browse Products
      </Button>
    </div>
  );

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-24">
        <h1 className="text-2xl font-bold text-foreground mb-6">My Orders</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="ongoing" className="relative">
              Ongoing
              {ongoingOrders.length > 0 && (
                <span className="ml-1.5 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                  {ongoingOrders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">
              History
              {completedOrders.length > 0 && (
                <span className="ml-1.5 text-muted-foreground text-[10px]">
                  ({completedOrders.length})
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ongoing" className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4 h-32" />
                  </Card>
                ))}
              </div>
            ) : ongoingOrders.length === 0 ? (
              <EmptyState message="You don't have any active orders right now." />
            ) : (
              ongoingOrders.map(order => <OrderCard key={order.id} order={order} />)
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4 h-32" />
                  </Card>
                ))}
              </div>
            ) : completedOrders.length === 0 ? (
              <EmptyState message="Your completed orders will appear here." />
            ) : (
              completedOrders.map(order => <OrderCard key={order.id} order={order} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Orders;