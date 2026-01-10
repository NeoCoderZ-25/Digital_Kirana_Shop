import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import StatsCard from '@/components/admin/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  IndianRupee,
  TrendingUp,
  Clock,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  pendingOrders: number;
  todayOrders: number;
}

interface RecentOrder {
  id: string;
  created_at: string;
  total_price: number;
  status: string;
  payment_status: string;
  profile: { username: string; email: string } | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    todayOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch orders stats
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_price, status, created_at');

      if (ordersError) throw ordersError;

      // Fetch products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Fetch customers count (unique user_ids from orders)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' });

      // Fetch recent orders
      const { data: recent } = await supabase
        .from('orders')
        .select('id, created_at, total_price, status, payment_status, user_id')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch profiles for recent orders
      const userIds = recent?.map(o => o.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, username, email')
        .in('user_id', userIds);

      const recentWithProfiles = recent?.map(order => ({
        ...order,
        profile: profilesData?.find(p => p.user_id === order.user_id) || null
      })) || [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_price), 0) || 0;
      const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
      const todayOrders = orders?.filter(o => new Date(o.created_at) >= today).length || 0;

      setStats({
        totalOrders: orders?.length || 0,
        totalRevenue,
        totalProducts: productsCount || 0,
        totalCustomers: profiles?.length || 0,
        pendingOrders,
        todayOrders
      });

      setRecentOrders(recentWithProfiles);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-accent/20 text-accent border-accent';
      case 'confirmed': return 'bg-success/20 text-success border-success';
      case 'processing': return 'bg-primary/20 text-primary border-primary';
      case 'out_for_delivery': return 'bg-primary/20 text-primary border-primary';
      case 'delivered': return 'bg-success/20 text-success border-success';
      case 'cancelled': return 'bg-destructive/20 text-destructive border-destructive';
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's what's happening.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={<ShoppingCart className="w-6 h-6" />}
            change={`${stats.todayOrders} today`}
            changeType="neutral"
          />
          <StatsCard
            title="Total Revenue"
            value={`₹${stats.totalRevenue.toLocaleString()}`}
            icon={<IndianRupee className="w-6 h-6" />}
          />
          <StatsCard
            title="Products"
            value={stats.totalProducts}
            icon={<Package className="w-6 h-6" />}
          />
          <StatsCard
            title="Customers"
            value={stats.totalCustomers}
            icon={<Users className="w-6 h-6" />}
          />
        </div>

        {/* Pending Orders Alert */}
        {stats.pendingOrders > 0 && (
          <Card className="border-accent bg-accent/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {stats.pendingOrders} pending order{stats.pendingOrders > 1 ? 's' : ''} need attention
                  </p>
                  <p className="text-sm text-muted-foreground">Review and confirm these orders</p>
                </div>
              </div>
              <Button onClick={() => navigate('/admin/orders?status=pending')}>
                View Orders
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/orders')}>
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No orders yet
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div 
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.profile?.username || order.profile?.email || 'Customer'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className={getStatusColor(order.status)}>
                        {order.status.replace('_', ' ')}
                      </Badge>
                      <div className="text-right">
                        <p className="font-medium text-foreground">₹{order.total_price}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), 'dd MMM, HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
