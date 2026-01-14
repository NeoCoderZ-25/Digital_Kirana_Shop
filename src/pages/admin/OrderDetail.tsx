import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  Phone, 
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  MessageSquare,
  Send,
  User,
  CreditCard,
  Calendar,
  Printer,
  PackageCheck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import InvoicePrint from '@/components/admin/InvoicePrint';
import { useReactToPrint } from 'react-to-print';

interface OrderDetail {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  total_price: number;
  payment_method: string;
  payment_status: string;
  scheduled_delivery: string | null;
  user_id: string;
  address: {
    label: string;
    address: string;
    phone: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    landmark: string | null;
  } | null;
  profile: { username: string; email: string; phone: string | null } | null;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: { name: string; image_url: string | null } | null;
    variant: { name: string } | null;
  }>;
  notes: { id: string; user_note: string | null; admin_reply: string | null } | null;
}

interface StatusHistory {
  id: string;
  status: string;
  notes: string | null;
  created_at: string;
}

const statusOptions = [
  { value: 'pending', label: 'Pending', icon: Clock, color: 'text-accent', bg: 'bg-accent' },
  { value: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'text-success', bg: 'bg-success' },
  { value: 'processing', label: 'Processing', icon: Package, color: 'text-primary', bg: 'bg-primary' },
  { value: 'packed', label: 'Packed', icon: PackageCheck, color: 'text-primary', bg: 'bg-primary' },
  { value: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, color: 'text-primary', bg: 'bg-primary' },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'text-success', bg: 'bg-success' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive' },
];

const paymentStatusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

const AdminOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [adminReply, setAdminReply] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${order?.id?.slice(0, 8).toUpperCase() || 'order'}`,
  });

  useEffect(() => {
    if (id) {
      fetchOrder();
      fetchStatusHistory();
    }
  }, [id]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, created_at, updated_at, status, total_price, payment_method, payment_status, scheduled_delivery, user_id,
          address:addresses(label, address, phone, city, state, pincode, landmark),
          items:order_items(
            id, quantity, price,
            product:products(name, image_url),
            variant:product_variants(name)
          ),
          notes:order_notes(id, user_note, admin_reply)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      
      // Fetch profile separately
      let profile = null;
      if (data?.user_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, email, phone')
          .eq('user_id', data.user_id)
          .maybeSingle();
        profile = profileData;
      }

      setOrder(data ? { ...data, profile } : null);
      if (data?.notes?.admin_reply) {
        setAdminReply(data.notes.admin_reply);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      toast({ title: 'Error', description: 'Failed to load order details', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStatusHistory(data || []);
    } catch (error) {
      console.error('Error fetching status history:', error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!order || !user) return;
    setUpdating(true);

    try {
      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', order.id);

      if (orderError) throw orderError;

      // Add to status history
      const { error: historyError } = await supabase
        .from('order_status_history')
        .insert({
          order_id: order.id,
          status: newStatus,
          changed_by: user.id,
          notes: statusNote || null
        });

      if (historyError) throw historyError;

      setOrder({ ...order, status: newStatus });
      setStatusNote('');
      fetchStatusHistory();
      toast({ title: 'Status Updated', description: `Order status changed to ${newStatus}` });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  const handlePaymentStatusChange = async (newStatus: string) => {
    if (!order) return;
    setUpdating(true);

    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', order.id);

      if (error) throw error;

      setOrder({ ...order, payment_status: newStatus });
      toast({ title: 'Payment Status Updated', description: `Payment status changed to ${newStatus}` });
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({ title: 'Error', description: 'Failed to update payment status', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  const handleSendReply = async () => {
    if (!order || !adminReply.trim()) return;
    setUpdating(true);

    try {
      if (order.notes?.id) {
        // Update existing note
        const { error } = await supabase
          .from('order_notes')
          .update({ admin_reply: adminReply, updated_at: new Date().toISOString() })
          .eq('id', order.notes.id);

        if (error) throw error;
      } else {
        // Create new note with reply
        const { error } = await supabase
          .from('order_notes')
          .insert({
            order_id: order.id,
            admin_reply: adminReply
          });

        if (error) throw error;
      }

      toast({ title: 'Reply Sent', description: 'Your reply has been sent to the customer' });
      fetchOrder();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({ title: 'Error', description: 'Failed to send reply', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-accent/20 text-accent';
      case 'confirmed': return 'bg-success/20 text-success';
      case 'processing': return 'bg-primary/20 text-primary';
      case 'packed': return 'bg-primary/20 text-primary';
      case 'out_for_delivery': return 'bg-primary/20 text-primary';
      case 'delivered': return 'bg-success/20 text-success';
      case 'cancelled': return 'bg-destructive/20 text-destructive';
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

  if (!order) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Button variant="ghost" onClick={() => navigate('/admin/orders')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-medium text-foreground">Order not found</h2>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/orders')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">
                  Order #{order.id.slice(0, 8).toUpperCase()}
                </h1>
                <Badge variant="outline" className={getStatusBadgeColor(order.status)}>
                  {order.status.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Placed on {format(new Date(order.created_at), 'PPP p')}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => handlePrint()}>
            <Printer className="w-4 h-4 mr-2" />
            Print Invoice
          </Button>
        </div>

        {/* Hidden Invoice for Print */}
        <div style={{ display: 'none' }}>
          <InvoicePrint ref={invoiceRef} order={order} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Management */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Order Status</label>
                    <Select value={order.status} onValueChange={handleStatusChange} disabled={updating}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center gap-2">
                              <status.icon className={cn("w-4 h-4", status.color)} />
                              {status.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Payment Status</label>
                    <Select value={order.payment_status} onValueChange={handlePaymentStatusChange} disabled={updating}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentStatusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Status Note (optional)</label>
                  <Textarea
                    placeholder="Add a note about this status change..."
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                        <img
                          src={item.product?.image_url || '/placeholder.svg'}
                          alt={item.product?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.product?.name}</p>
                        {item.variant && (
                          <p className="text-sm text-muted-foreground">Variant: {item.variant.name}</p>
                        )}
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium text-foreground">₹{item.price * item.quantity}</p>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-foreground">Total</span>
                    <span className="text-xl font-bold text-foreground">₹{order.total_price}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Notes & Reply */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Customer Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.notes?.user_note ? (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Customer's Note:</p>
                    <p className="text-foreground">{order.notes.user_note}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No notes from customer</p>
                )}

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Your Reply</label>
                  <Textarea
                    placeholder="Write a reply to the customer..."
                    value={adminReply}
                    onChange={(e) => setAdminReply(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button onClick={handleSendReply} disabled={updating || !adminReply.trim()}>
                  <Send className="w-4 h-4 mr-2" />
                  Send Reply
                </Button>
              </CardContent>
            </Card>

            {/* Status History */}
            {statusHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {statusHistory.map((history, index) => (
                      <div key={history.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            index === 0 ? 'bg-primary' : 'bg-muted-foreground/30'
                          )} />
                          {index < statusHistory.length - 1 && (
                            <div className="w-px h-full bg-border flex-1 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getStatusBadgeColor(history.status)}>
                              {history.status.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(history.created_at), 'PPP p')}
                            </span>
                          </div>
                          {history.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{history.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Customer & Delivery Info */}
          <div className="space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium text-foreground">
                    {order.profile?.username || 'Customer'}
                  </p>
                  <p className="text-sm text-muted-foreground">{order.profile?.email}</p>
                </div>
                {order.profile?.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {order.profile.phone}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery Address */}
            {order.address && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-medium text-foreground">{order.address.label}</p>
                  <p className="text-sm text-muted-foreground">{order.address.address}</p>
                  {order.address.landmark && (
                    <p className="text-sm text-muted-foreground">Near: {order.address.landmark}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {order.address.city}, {order.address.state} - {order.address.pincode}
                  </p>
                  {order.address.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                      <Phone className="w-4 h-4" />
                      {order.address.phone}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-medium text-foreground uppercase">{order.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline" className={cn(
                    order.payment_status === 'paid' ? 'bg-success/20 text-success' :
                    order.payment_status === 'pending' ? 'bg-accent/20 text-accent' :
                    'bg-destructive/20 text-destructive'
                  )}>
                    {order.payment_status}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium text-foreground">Total</span>
                  <span className="font-bold text-foreground">₹{order.total_price}</span>
                </div>
              </CardContent>
            </Card>

            {/* Scheduled Delivery */}
            {order.scheduled_delivery && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Scheduled Delivery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium text-foreground">
                    {format(new Date(order.scheduled_delivery), 'PPP p')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrderDetail;
