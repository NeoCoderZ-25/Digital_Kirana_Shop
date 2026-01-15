import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2, 
  Truck,
  User,
  Package,
  Navigation,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import AddressMap from '@/components/AddressMap';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    image_url: string | null;
  } | null;
  variant: {
    name: string;
  } | null;
}

interface OrderDetail {
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
    landmark: string | null;
  } | null;
  profile: {
    username: string;
    phone: string;
  } | null;
  items: OrderItem[];
}

export default function DeliveryOrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) {
      fetchOrder();
    }
  }, [id, user]);

  const fetchOrder = async () => {
    try {
      const { data: orderData, error } = await supabase
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
          address_id,
          user_id
        `)
        .eq('id', id)
        .eq('assigned_delivery_boy', user?.id)
        .single();

      if (error) throw error;

      // Fetch address separately
      let address = null;
      if (orderData.address_id) {
        const { data: addressData } = await supabase
          .from('addresses')
          .select('label, address, phone, city, state, pincode, latitude, longitude, landmark')
          .eq('id', orderData.address_id)
          .single();
        address = addressData;
      }

      // Fetch profile separately
      let profile = null;
      if (orderData.user_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, phone')
          .eq('user_id', orderData.user_id)
          .single();
        profile = profileData;
      }

      // Fetch order items
      const { data: itemsData } = await supabase
        .from('order_items')
        .select(`
          id,
          quantity,
          price,
          products (
            name,
            image_url
          ),
          product_variants (
            name
          )
        `)
        .eq('order_id', id);

      setOrder({
        ...orderData,
        address,
        profile,
        items: (itemsData || []).map(item => ({
          ...item,
          product: item.products,
          variant: item.product_variants,
        })),
      });
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (status: string, timeField: string) => {
    try {
      const updates: any = { 
        status,
        [timeField]: new Date().toISOString()
      };

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      fetchOrder();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-lg mx-auto space-y-4">
          <Card className="animate-pulse">
            <CardContent className="h-64" />
          </Card>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-lg mx-auto text-center py-12">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium">Order not found</p>
          <Button variant="link" onClick={() => navigate('/delivery')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const customerPhone = order.address?.phone || order.profile?.phone;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/delivery')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-bold">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
            <p className="text-xs text-muted-foreground">
              {format(new Date(order.created_at), 'MMM d, yyyy • HH:mm')}
            </p>
          </div>
          <Badge className={`${getStatusColor(order.status)} text-white`}>
            {order.status.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Map */}
        {order.address?.latitude && order.address?.longitude && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Delivery Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AddressMap
                latitude={order.address.latitude}
                longitude={order.address.longitude}
                draggable={false}
                height="200px"
              />
              <Button 
                className="w-full mt-3"
                asChild
              >
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${order.address.latitude},${order.address.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Navigate with Google Maps
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Customer Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="w-4 h-4" />
              Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium">{order.profile?.username || 'Customer'}</p>
              <p className="text-sm text-muted-foreground">{order.address?.label}</p>
            </div>
            
            <div className="text-sm">
              <p>{order.address?.address}</p>
              <p>{order.address?.city}, {order.address?.state} - {order.address?.pincode}</p>
              {order.address?.landmark && (
                <p className="text-muted-foreground">Landmark: {order.address.landmark}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" asChild>
                <a href={`tel:${customerPhone}`}>
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </a>
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <a href={`sms:${customerPhone}`}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="w-4 h-4" />
              Order Items ({order.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.items.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                {item.product?.image_url && (
                  <img 
                    src={item.product.image_url} 
                    alt={item.product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.product?.name}</p>
                  {item.variant && (
                    <p className="text-xs text-muted-foreground">{item.variant.name}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm">x{item.quantity}</p>
                  <p className="text-sm font-medium">₹{Number(item.price).toFixed(2)}</p>
                </div>
              </div>
            ))}
            
            <Separator />
            
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>₹{Number(order.total_price).toFixed(2)}</span>
            </div>
            
            <Badge variant="outline" className="w-full justify-center py-1.5">
              {order.payment_method === 'cod' ? '💵 Cash on Delivery' : '✅ Prepaid'}
              {order.payment_method === 'cod' && (
                <span className="ml-2 font-medium">
                  Collect ₹{Number(order.total_price).toFixed(2)}
                </span>
              )}
            </Badge>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Delivery Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${order.delivery_accepted_at ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div className="flex-1">
                  <p className={`text-sm ${order.delivery_accepted_at ? 'font-medium' : 'text-muted-foreground'}`}>
                    Order Accepted
                  </p>
                  {order.delivery_accepted_at && (
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.delivery_accepted_at), 'HH:mm')}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${order.delivery_started_at ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div className="flex-1">
                  <p className={`text-sm ${order.delivery_started_at ? 'font-medium' : 'text-muted-foreground'}`}>
                    On The Way
                  </p>
                  {order.delivery_started_at && (
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.delivery_started_at), 'HH:mm')}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${order.delivered_at ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div className="flex-1">
                  <p className={`text-sm ${order.delivered_at ? 'font-medium' : 'text-muted-foreground'}`}>
                    Delivered
                  </p>
                  {order.delivered_at && (
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.delivered_at), 'HH:mm')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Action Buttons */}
      {order.status !== 'delivered' && order.status !== 'cancelled' && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
          <div className="max-w-lg mx-auto">
            {!order.delivery_accepted_at && (
              <Button 
                className="w-full"
                size="lg"
                onClick={() => updateOrderStatus('out_for_delivery', 'delivery_accepted_at')}
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Accept Order
              </Button>
            )}
            
            {order.delivery_accepted_at && !order.delivery_started_at && (
              <Button 
                className="w-full"
                size="lg"
                onClick={() => updateOrderStatus('out_for_delivery', 'delivery_started_at')}
              >
                <Truck className="w-5 h-5 mr-2" />
                Start Delivery
              </Button>
            )}
            
            {order.delivery_started_at && order.status !== 'delivered' && (
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
                onClick={() => updateOrderStatus('delivered', 'delivered_at')}
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Mark as Delivered
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
