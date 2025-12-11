import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, Package, Truck, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Order {
  id: string;
  created_at: string;
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

const statusSteps = [
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'out_for_delivery', label: 'On the Way', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

const Orders = () => {
  const [activeTab, setActiveTab] = useState('ongoing');
  const { user } = useAuth();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
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

  const getStatusIndex = (status: string) => {
    const index = statusSteps.findIndex(s => s.key === status);
    return index === -1 ? 0 : index;
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

  const ongoingOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const completedOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

  const OrderCard = ({ order }: { order: Order }) => {
    const currentStep = getStatusIndex(order.status);
    const isCompleted = order.status === 'delivered';
    const isCancelled = order.status === 'cancelled';

    return (
      <Card className="animate-fade-in">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs text-muted-foreground">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(order.created_at), 'dd MMM yyyy, h:mm a')}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-foreground">₹{order.total_price}</p>
              <p className="text-xs text-muted-foreground capitalize">{order.payment_method}</p>
            </div>
          </div>

          {/* Items Preview */}
          <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
            {order.items.slice(0, 3).map((item) => (
              <div key={item.id} className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={item.product?.image_url || '/placeholder.svg'}
                  alt={item.product?.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {order.items.length > 3 && (
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium">+{order.items.length - 3}</span>
              </div>
            )}
          </div>

          {/* Status Progress */}
          {!isCancelled && !isCompleted && (
            <div className="mb-3">
              <div className="flex justify-between mb-2">
                {statusSteps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = index <= currentStep;
                  return (
                    <div key={step.key} className="flex flex-col items-center flex-1">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                          isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        )}
                      >
                        <StepIcon className="w-4 h-4" />
                      </div>
                      <span className={cn(
                        'text-[10px] mt-1 text-center',
                        isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                      )}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 animate-progress-fill"
                  style={{ '--progress-width': `${((currentStep + 1) / statusSteps.length) * 100}%` } as React.CSSProperties}
                />
              </div>
            </div>
          )}

          {/* Status Badge for completed/cancelled */}
          {(isCompleted || isCancelled) && (
            <div className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mb-3',
              isCompleted ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
            )}>
              {isCompleted ? <CheckCircle className="w-3 h-3" /> : null}
              {isCompleted ? 'Delivered' : 'Cancelled'}
            </div>
          )}

          {/* Notes */}
          {order.notes && (order.notes.user_note || order.notes.admin_reply) && (
            <div className="space-y-2 mb-3">
              {order.notes.user_note && (
                <div className="bg-muted/50 rounded-lg p-2 text-sm">
                  <span className="text-muted-foreground">Your note: </span>
                  {order.notes.user_note}
                </div>
              )}
              {order.notes.admin_reply && (
                <div className="bg-primary/10 rounded-lg p-2 text-sm">
                  <span className="text-primary font-medium">Store reply: </span>
                  {order.notes.admin_reply}
                </div>
              )}
            </div>
          )}

          {/* Reorder Button */}
          {isCompleted && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleReorder(order)}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reorder
            </Button>
          )}
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
      <Button asChild variant="outline">
        <a href="/">Browse Products</a>
      </Button>
    </div>
  );

  return (
    <AppLayout>
      <div className="px-4 pt-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">My Orders</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="ongoing">
              Ongoing {ongoingOrders.length > 0 && `(${ongoingOrders.length})`}
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed {completedOrders.length > 0 && `(${completedOrders.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ongoing" className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : ongoingOrders.length === 0 ? (
              <EmptyState message="You don't have any active orders right now." />
            ) : (
              ongoingOrders.map(order => <OrderCard key={order.id} order={order} />)
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
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
