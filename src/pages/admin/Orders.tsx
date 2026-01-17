import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter,
  ChevronRight,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Order {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  total_price: number;
  payment_method: string;
  payment_status: string;
  user_id: string;
  assigned_delivery_boy: string | null;
  profile: { username: string; email: string; phone: string | null } | null;
  items: Array<{ quantity: number }>;
}

const deliveryFilterOptions = [
  { value: 'all', label: 'All Delivery Status' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'unassigned', label: 'Unassigned' },
];

const statusOptions = [
  { value: 'all', label: 'All Orders' },
  { value: 'pending', label: 'Pending', icon: Clock, color: 'text-accent' },
  { value: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'text-success' },
  { value: 'processing', label: 'Processing', icon: Package, color: 'text-primary' },
  { value: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, color: 'text-primary' },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'text-success' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'text-destructive' },
];

const AdminOrders = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [deliveryFilter, setDeliveryFilter] = useState(searchParams.get('delivery') || 'all');

  useEffect(() => {
    fetchOrders();

    // Real-time subscription
    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, created_at, updated_at, status, total_price, payment_method, payment_status, user_id, assigned_delivery_boy, items:order_items(quantity)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const userIds = data?.map(o => o.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, username, email, phone')
        .in('user_id', userIds);

      const ordersWithProfiles = data?.map(order => ({
        ...order,
        profile: profilesData?.find(p => p.user_id === order.user_id) || null
      })) || [];

      setOrders(ordersWithProfiles);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const config = statusOptions.find(s => s.value === status);
    return config || { label: status, color: 'text-muted-foreground' };
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = searchQuery === '' || 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.profile?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.profile?.phone?.includes(searchQuery);
    const matchesDelivery = deliveryFilter === 'all' || 
      (deliveryFilter === 'assigned' && order.assigned_delivery_boy) ||
      (deliveryFilter === 'unassigned' && !order.assigned_delivery_boy);
    
    return matchesStatus && matchesSearch && matchesDelivery;
  });

  const handleDeliveryFilterChange = (value: string) => {
    setDeliveryFilter(value);
    if (value === 'all') {
      searchParams.delete('delivery');
    } else {
      searchParams.set('delivery', value);
    }
    setSearchParams(searchParams);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    if (value === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', value);
    }
    setSearchParams(searchParams);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-accent/20 text-accent';
      case 'confirmed': return 'bg-success/20 text-success';
      case 'processing': return 'bg-primary/20 text-primary';
      case 'out_for_delivery': return 'bg-primary/20 text-primary';
      case 'delivered': return 'bg-success/20 text-success';
      case 'cancelled': return 'bg-destructive/20 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPaymentBadgeColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-success/20 text-success';
      case 'pending': return 'bg-accent/20 text-accent';
      case 'failed': return 'bg-destructive/20 text-destructive';
      case 'refunded': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground">Manage and track all customer orders</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by order ID, customer name, email or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={deliveryFilter} onValueChange={handleDeliveryFilterChange}>
            <SelectTrigger className="w-full sm:w-48">
              <Truck className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by delivery" />
            </SelectTrigger>
            <SelectContent>
              {deliveryFilterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((status) => {
            const count = status.value === 'all' 
              ? orders.length 
              : orders.filter(o => o.status === status.value).length;
            
            return (
              <Button
                key={status.value}
                variant={statusFilter === status.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilterChange(status.value)}
                className="gap-1"
              >
                {status.label}
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  statusFilter === status.value 
                    ? "bg-primary-foreground/20" 
                    : "bg-muted"
                )}>
                  {count}
                </span>
              </Button>
            );
          })}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-foreground">No orders found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'Orders will appear here when customers place them'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
              
              return (
                <Card 
                  key={order.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/admin/orders/${order.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Package className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-foreground">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </p>
                            <Badge variant="outline" className={getStatusBadgeColor(order.status)}>
                              {order.status.replace('_', ' ')}
                            </Badge>
                            {order.assigned_delivery_boy ? (
                              <Badge variant="outline" className="bg-success/20 text-success">
                                <Truck className="w-3 h-3 mr-1" />
                                Assigned
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-muted text-muted-foreground">
                                Unassigned
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {order.profile?.username || order.profile?.email || 'Customer'}
                            {order.profile?.phone && ` • ${order.profile.phone}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                            {' • '}{totalItems} item{totalItems > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-foreground">₹{order.total_price}</p>
                          <Badge variant="outline" className={getPaymentBadgeColor(order.payment_status)}>
                            {order.payment_status}
                          </Badge>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
