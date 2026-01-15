import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2, 
  Truck,
  User,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface DeliveryOrder {
  id: string;
  status: string;
  total_price: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  delivery_accepted_at: string | null;
  delivery_started_at: string | null;
  delivered_at: string | null;
  address: {
    label: string;
    address: string;
    phone: string;
    city: string;
    state: string;
    pincode: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
  profile: {
    username: string;
    phone: string;
  } | null;
  items_count: number;
}

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    if (user) {
      fetchOrders();
      
      // Subscribe to real-time updates
      const channel = supabase
        .channel('delivery-orders')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `assigned_delivery_boy=eq.${user.id}`,
          },
          () => {
            fetchOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          total_price,
          payment_method,
          payment_status,
          created_at,
          delivery_accepted_at,
          delivery_started_at,
          delivered_at,
          user_id,
          address_id
        `)
        .eq('assigned_delivery_boy', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get related data for each order
      const ordersWithDetails = await Promise.all(
        (ordersData || []).map(async (order) => {
          // Get item count
          const { count } = await supabase
            .from('order_items')
            .select('*', { count: 'exact', head: true })
            .eq('order_id', order.id);

          // Get address
          let address = null;
          if (order.address_id) {
            const { data: addressData } = await supabase
              .from('addresses')
              .select('label, address, phone, city, state, pincode, latitude, longitude')
              .eq('id', order.address_id)
              .single();
            address = addressData;
          }

          // Get profile
          let profile = null;
          if (order.user_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('username, phone')
              .eq('user_id', order.user_id)
              .single();
            profile = profileData;
          }

          return {
            ...order,
            address,
            profile,
            items_count: count || 0,
          };
        })
      );

      setOrders(ordersWithDetails);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string, timeField: string) => {
    try {
      const updates: any = { 
        status,
        [timeField]: new Date().toISOString()
      };

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'processing': return 'bg-blue-500';
      case 'packed': return 'bg-purple-500';
      case 'out_for_delivery': return 'bg-orange-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const filterOrders = (tab: string) => {
    switch (tab) {
      case 'pending':
        return orders.filter(o => ['packed', 'processing'].includes(o.status) && !o.delivery_accepted_at);
      case 'active':
        return orders.filter(o => ['out_for_delivery'].includes(o.status) || (o.delivery_accepted_at && o.status !== 'delivered'));
      case 'completed':
        return orders.filter(o => o.status === 'delivered');
      default:
        return orders;
    }
  };

  const pendingCount = filterOrders('pending').length;
  const activeCount = filterOrders('active').length;
  const completedCount = filterOrders('completed').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-lg mx-auto space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" />
            Delivery Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 max-w-lg mx-auto">
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-yellow-500">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-500">{activeCount}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-green-500">{completedCount}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="pending" className="flex-1">
              Pending ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="active" className="flex-1">
              Active ({activeCount})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1">
              Done ({completedCount})
            </TabsTrigger>
          </TabsList>

          {['pending', 'active', 'completed'].map(tab => (
            <TabsContent key={tab} value={tab} className="mt-4 space-y-3">
              {filterOrders(tab).length === 0 ? (
                <Card className="p-6 text-center text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No {tab} orders</p>
                </Card>
              ) : (
                filterOrders(tab).map(order => (
                  <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-mono">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </CardTitle>
                        <Badge className={`${getStatusColor(order.status)} text-white`}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Customer info */}
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{order.profile?.username || 'Customer'}</span>
                      </div>

                      {/* Address */}
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">{order.address?.label}</p>
                          <p className="text-muted-foreground text-xs">
                            {order.address?.address}, {order.address?.city}
                          </p>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={`tel:${order.address?.phone || order.profile?.phone}`}
                          className="text-primary hover:underline"
                        >
                          {order.address?.phone || order.profile?.phone}
                        </a>
                      </div>

                      {/* Order info */}
                      <div className="flex items-center justify-between text-sm pt-2 border-t">
                        <span className="text-muted-foreground">
                          {order.items_count} items • ₹{Number(order.total_price).toFixed(2)}
                        </span>
                        <Badge variant="outline">
                          {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Prepaid'}
                        </Badge>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-2">
                        {tab === 'pending' && (
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => updateOrderStatus(order.id, 'out_for_delivery', 'delivery_accepted_at')}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                        )}
                        
                        {tab === 'active' && order.status === 'out_for_delivery' && !order.delivery_started_at && (
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => updateOrderStatus(order.id, 'out_for_delivery', 'delivery_started_at')}
                          >
                            <Truck className="w-4 h-4 mr-1" />
                            Start Delivery
                          </Button>
                        )}

                        {tab === 'active' && order.delivery_started_at && order.status !== 'delivered' && (
                          <Button 
                            size="sm" 
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => updateOrderStatus(order.id, 'delivered', 'delivered_at')}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Mark Delivered
                          </Button>
                        )}

                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/delivery/order/${order.id}`)}
                        >
                          Details
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>

                        {order.address?.latitude && order.address?.longitude && (
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${order.address.latitude},${order.address.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MapPin className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>

                      {/* Timing info */}
                      {(order.delivery_accepted_at || order.delivery_started_at || order.delivered_at) && (
                        <div className="text-xs text-muted-foreground pt-2 border-t space-y-1">
                          {order.delivery_accepted_at && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Accepted: {format(new Date(order.delivery_accepted_at), 'HH:mm')}
                            </div>
                          )}
                          {order.delivery_started_at && (
                            <div className="flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              Started: {format(new Date(order.delivery_started_at), 'HH:mm')}
                            </div>
                          )}
                          {order.delivered_at && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Delivered: {format(new Date(order.delivered_at), 'HH:mm')}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
