import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Tag, 
  Edit, 
  Trash2,
  Percent,
  IndianRupee,
  Calendar,
  Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order_amount: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  per_user_limit: number | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

const AdminCoupons = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteCoupon, setDeleteCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast({ title: 'Error', description: 'Failed to load coupons', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !coupon.is_active })
        .eq('id', coupon.id);

      if (error) throw error;

      setCoupons(prev => prev.map(c => 
        c.id === coupon.id ? { ...c, is_active: !c.is_active } : c
      ));
      toast({ title: coupon.is_active ? 'Coupon deactivated' : 'Coupon activated' });
    } catch (error) {
      console.error('Error toggling coupon:', error);
      toast({ title: 'Error', description: 'Failed to update coupon', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteCoupon) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', deleteCoupon.id);

      if (error) throw error;

      setCoupons(prev => prev.filter(c => c.id !== deleteCoupon.id));
      toast({ title: 'Coupon deleted' });
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast({ title: 'Error', description: 'Failed to delete coupon', variant: 'destructive' });
    } finally {
      setDeleteCoupon(null);
    }
  };

  const isExpired = (coupon: Coupon) => {
    if (!coupon.valid_until) return false;
    return new Date(coupon.valid_until) < new Date();
  };

  const isFullyRedeemed = (coupon: Coupon) => {
    if (!coupon.usage_limit) return false;
    return coupon.used_count >= coupon.usage_limit;
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
            <h1 className="text-2xl font-bold text-foreground">Coupons</h1>
            <p className="text-muted-foreground">Manage discount coupons</p>
          </div>
          <Button onClick={() => navigate('/admin/coupons/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Coupon
          </Button>
        </div>

        {coupons.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">No coupons yet</h3>
              <p className="text-muted-foreground mb-4">Create your first discount coupon</p>
              <Button onClick={() => navigate('/admin/coupons/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Coupon
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {coupons.map((coupon) => (
              <Card key={coupon.id} className={!coupon.is_active ? 'opacity-60' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {coupon.discount_type === 'percentage' ? (
                            <Percent className="w-5 h-5 text-primary" />
                          ) : (
                            <IndianRupee className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold font-mono text-foreground">{coupon.code}</h3>
                          <p className="text-sm text-muted-foreground">{coupon.description}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Discount</p>
                          <p className="font-semibold text-foreground">
                            {coupon.discount_type === 'percentage' 
                              ? `${coupon.discount_value}%` 
                              : `₹${coupon.discount_value}`}
                            {coupon.max_discount && ` (max ₹${coupon.max_discount})`}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Min Order</p>
                          <p className="font-semibold text-foreground">
                            {coupon.min_order_amount ? `₹${coupon.min_order_amount}` : 'None'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Usage</p>
                          <p className="font-semibold text-foreground">
                            {coupon.used_count}/{coupon.usage_limit || '∞'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Valid Until</p>
                          <p className="font-semibold text-foreground">
                            {coupon.valid_until ? format(new Date(coupon.valid_until), 'PP') : 'No expiry'}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        {!coupon.is_active && <Badge variant="secondary">Inactive</Badge>}
                        {isExpired(coupon) && <Badge variant="destructive">Expired</Badge>}
                        {isFullyRedeemed(coupon) && <Badge variant="secondary">Fully Redeemed</Badge>}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Active</span>
                        <Switch 
                          checked={coupon.is_active}
                          onCheckedChange={() => handleToggleActive(coupon)}
                        />
                      </div>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => navigate(`/admin/coupons/${coupon.id}/edit`)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteCoupon(coupon)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCoupon} onOpenChange={() => setDeleteCoupon(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteCoupon?.code}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminCoupons;
