import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, Mail, Phone, ShoppingBag, MapPin, Shield, Truck, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface Customer {
  id: string;
  user_id: string;
  username: string;
  email: string;
  phone: string | null;
  created_at: string | null;
  order_count: number;
  total_spent: number;
  role: AppRole;
}

interface CustomerDetail extends Customer {
  addresses: Array<{
    id: string;
    label: string;
    address: string;
    city: string | null;
    state: string | null;
    pincode: string | null;
  }>;
  orders: Array<{
    id: string;
    created_at: string;
    status: string;
    total_price: number;
  }>;
}

const roleLabels: Record<AppRole, { label: string; icon: React.ReactNode; color: string }> = {
  user: { label: 'User', icon: <Users className="w-3 h-3" />, color: 'bg-blue-500/20 text-blue-500' },
  delivery_boy: { label: 'Delivery', icon: <Truck className="w-3 h-3" />, color: 'bg-orange-500/20 text-orange-500' },
  admin: { label: 'Admin', icon: <Shield className="w-3 h-3" />, color: 'bg-purple-500/20 text-purple-500' },
};

const Customers = () => {
  const { user: currentUser } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    
    // Fetch profiles with order stats
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching customers:', profilesError);
      toast({ title: 'Error', description: 'Failed to fetch customers', variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Fetch roles for all users
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role');

    const rolesMap = new Map<string, AppRole>();
    roles?.forEach(r => rolesMap.set(r.user_id, r.role));

    // Fetch order stats for each customer
    const customersWithStats = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { data: orders } = await supabase
          .from('orders')
          .select('total_price')
          .eq('user_id', profile.user_id);

        const orderCount = orders?.length || 0;
        const totalSpent = orders?.reduce((sum, o) => sum + Number(o.total_price), 0) || 0;

        return {
          ...profile,
          order_count: orderCount,
          total_spent: totalSpent,
          role: rolesMap.get(profile.user_id) || 'user' as AppRole,
        };
      })
    );

    setCustomers(customersWithStats);
    setLoading(false);
  };

  const openCustomerDetail = async (customer: Customer) => {
    // Fetch addresses and orders
    const [addressesRes, ordersRes] = await Promise.all([
      supabase
        .from('addresses')
        .select('id, label, address, city, state, pincode')
        .eq('user_id', customer.user_id),
      supabase
        .from('orders')
        .select('id, created_at, status, total_price')
        .eq('user_id', customer.user_id)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    setSelectedCustomer({
      ...customer,
      addresses: addressesRes.data || [],
      orders: ordersRes.data || []
    });
    setDetailDialogOpen(true);
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    if (userId === currentUser?.id) {
      toast({ title: 'Error', description: 'You cannot change your own role', variant: 'destructive' });
      return;
    }

    setUpdatingRole(userId);

    try {
      // Check if user already has a role entry
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      }

      // Update local state
      setCustomers(prev => prev.map(c => 
        c.user_id === userId ? { ...c, role: newRole } : c
      ));

      if (selectedCustomer?.user_id === userId) {
        setSelectedCustomer(prev => prev ? { ...prev, role: newRole } : null);
      }

      toast({ title: 'Success', description: `Role updated to ${roleLabels[newRole].label}` });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' });
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (userId === currentUser?.id) {
      toast({ title: 'Error', description: 'You cannot delete yourself', variant: 'destructive' });
      return;
    }

    setDeletingUser(userId);

    try {
      // Delete user's profile (this will cascade to related data based on DB constraints)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setCustomers(prev => prev.filter(c => c.user_id !== userId));
      
      if (selectedCustomer?.user_id === userId) {
        setDetailDialogOpen(false);
        setSelectedCustomer(null);
      }

      toast({ title: 'Success', description: `User ${username} has been deleted` });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' });
    } finally {
      setDeletingUser(null);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-500/20 text-green-500';
      case 'cancelled': return 'bg-destructive/20 text-destructive';
      case 'pending': return 'bg-yellow-500/20 text-yellow-500';
      default: return 'bg-primary/20 text-primary';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground">View and manage customer information and roles</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-24" />
              </Card>
            ))}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg">No customers found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try a different search term' : 'Customers will appear here'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredCustomers.map(customer => (
              <Card key={customer.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => openCustomerDetail(customer)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">
                          {customer.username}
                        </h3>
                        <Badge className={roleLabels[customer.role].color}>
                          {roleLabels[customer.role].icon}
                          <span className="ml-1">{roleLabels[customer.role].label}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {customer.email}
                        </span>
                        {customer.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {customer.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          ₹{customer.total_spent.toFixed(0)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {customer.order_count} order{customer.order_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      
                      <Select
                        value={customer.role}
                        onValueChange={(value: AppRole) => handleRoleChange(customer.user_id, value)}
                        disabled={updatingRole === customer.user_id || customer.user_id === currentUser?.id}
                      >
                        <SelectTrigger className="w-32">
                          {updatingRole === customer.user_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">
                            <span className="flex items-center gap-2">
                              <Users className="w-3 h-3" /> User
                            </span>
                          </SelectItem>
                          <SelectItem value="delivery_boy">
                            <span className="flex items-center gap-2">
                              <Truck className="w-3 h-3" /> Delivery
                            </span>
                          </SelectItem>
                          <SelectItem value="admin">
                            <span className="flex items-center gap-2">
                              <Shield className="w-3 h-3" /> Admin
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={customer.user_id === currentUser?.id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete <strong>{customer.username}</strong>? 
                              This will remove their profile and associated data. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(customer.user_id, customer.username)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deletingUser === customer.user_id ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : null}
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Customer Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Customer Details</DialogTitle>
            </DialogHeader>
            {selectedCustomer && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{selectedCustomer.username}</h3>
                    <Badge className={roleLabels[selectedCustomer.role].color}>
                      {roleLabels[selectedCustomer.role].icon}
                      <span className="ml-1">{roleLabels[selectedCustomer.role].label}</span>
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {selectedCustomer.email}
                    </span>
                    {selectedCustomer.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {selectedCustomer.phone}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 mt-2">
                    <Badge variant="secondary">
                      {selectedCustomer.order_count} Orders
                    </Badge>
                    <Badge variant="secondary">
                      ₹{selectedCustomer.total_spent.toFixed(0)} Spent
                    </Badge>
                  </div>
                </div>

                {/* Role Management */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Role Management
                  </h4>
                  <Select
                    value={selectedCustomer.role}
                    onValueChange={(value: AppRole) => handleRoleChange(selectedCustomer.user_id, value)}
                    disabled={updatingRole === selectedCustomer.user_id || selectedCustomer.user_id === currentUser?.id}
                  >
                    <SelectTrigger className="w-48">
                      {updatingRole === selectedCustomer.user_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <SelectValue />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">
                        <span className="flex items-center gap-2">
                          <Users className="w-3 h-3" /> User
                        </span>
                      </SelectItem>
                      <SelectItem value="delivery_boy">
                        <span className="flex items-center gap-2">
                          <Truck className="w-3 h-3" /> Delivery Boy
                        </span>
                      </SelectItem>
                      <SelectItem value="admin">
                        <span className="flex items-center gap-2">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedCustomer.user_id === currentUser?.id && (
                    <p className="text-xs text-muted-foreground mt-1">You cannot change your own role</p>
                  )}
                </div>

                {/* Addresses */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Saved Addresses
                  </h4>
                  {selectedCustomer.addresses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No addresses saved</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedCustomer.addresses.map(addr => (
                        <Card key={addr.id}>
                          <CardContent className="p-3">
                            <p className="font-medium">{addr.label}</p>
                            <p className="text-sm text-muted-foreground">
                              {addr.address}
                              {addr.city && `, ${addr.city}`}
                              {addr.state && `, ${addr.state}`}
                              {addr.pincode && ` - ${addr.pincode}`}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Orders */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    Recent Orders
                  </h4>
                  {selectedCustomer.orders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No orders yet</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedCustomer.orders.map(order => (
                        <Card key={order.id}>
                          <CardContent className="p-3 flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                #{order.id.slice(0, 8).toUpperCase()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(order.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">₹{Number(order.total_price).toFixed(0)}</p>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default Customers;
