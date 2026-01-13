import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Loader2, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CouponFormData {
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  per_user_limit: number | null;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

const AdminCouponForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CouponFormData>({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_amount: null,
    max_discount: null,
    usage_limit: null,
    per_user_limit: 1,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    is_active: true,
  });

  useEffect(() => {
    if (id) {
      fetchCoupon();
    }
  }, [id]);

  const fetchCoupon = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData({
          code: data.code,
          description: data.description || '',
          discount_type: data.discount_type as 'percentage' | 'fixed',
          discount_value: data.discount_value,
          min_order_amount: data.min_order_amount,
          max_discount: data.max_discount,
          usage_limit: data.usage_limit,
          per_user_limit: data.per_user_limit,
          valid_from: data.valid_from ? new Date(data.valid_from).toISOString().split('T')[0] : '',
          valid_until: data.valid_until ? new Date(data.valid_until).toISOString().split('T')[0] : '',
          is_active: data.is_active,
        });
      }
    } catch (error) {
      console.error('Error fetching coupon:', error);
      toast({ title: 'Error', description: 'Failed to load coupon', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code.trim()) {
      toast({ title: 'Error', description: 'Coupon code is required', variant: 'destructive' });
      return;
    }

    if (formData.discount_value <= 0) {
      toast({ title: 'Error', description: 'Discount value must be greater than 0', variant: 'destructive' });
      return;
    }

    setSaving(true);

    try {
      const couponData = {
        code: formData.code.toUpperCase(),
        description: formData.description || null,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        min_order_amount: formData.min_order_amount || null,
        max_discount: formData.max_discount || null,
        usage_limit: formData.usage_limit || null,
        per_user_limit: formData.per_user_limit || 1,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
        is_active: formData.is_active,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', id);

        if (error) throw error;
        toast({ title: 'Coupon updated' });
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert(couponData);

        if (error) {
          if (error.code === '23505') {
            toast({ title: 'Error', description: 'Coupon code already exists', variant: 'destructive' });
            return;
          }
          throw error;
        }
        toast({ title: 'Coupon created' });
      }

      navigate('/admin/coupons');
    } catch (error) {
      console.error('Error saving coupon:', error);
      toast({ title: 'Error', description: 'Failed to save coupon', variant: 'destructive' });
    } finally {
      setSaving(false);
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
      <div className="p-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/coupons')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isEditing ? 'Edit Coupon' : 'Create Coupon'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? 'Update coupon details' : 'Create a new discount coupon'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Coupon Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Coupon Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="SUMMER20"
                    className="font-mono"
                  />
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Get 20% off on all products"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Discount</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Discount Type</Label>
                <RadioGroup
                  value={formData.discount_type}
                  onValueChange={(value) => setFormData({ ...formData, discount_type: value as 'percentage' | 'fixed' })}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="percentage" id="percentage" />
                    <Label htmlFor="percentage">Percentage (%)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <Label htmlFor="fixed">Fixed Amount (₹)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount_value">
                    Discount Value {formData.discount_type === 'percentage' ? '(%)' : '(₹)'} *
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                    min={0}
                    max={formData.discount_type === 'percentage' ? 100 : undefined}
                  />
                </div>
                {formData.discount_type === 'percentage' && (
                  <div>
                    <Label htmlFor="max_discount">Max Discount (₹)</Label>
                    <Input
                      id="max_discount"
                      type="number"
                      value={formData.max_discount || ''}
                      onChange={(e) => setFormData({ ...formData, max_discount: parseFloat(e.target.value) || null })}
                      placeholder="No limit"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="min_order_amount">Minimum Order Amount (₹)</Label>
                <Input
                  id="min_order_amount"
                  type="number"
                  value={formData.min_order_amount || ''}
                  onChange={(e) => setFormData({ ...formData, min_order_amount: parseFloat(e.target.value) || null })}
                  placeholder="No minimum"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Usage Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="usage_limit">Total Usage Limit</Label>
                  <Input
                    id="usage_limit"
                    type="number"
                    value={formData.usage_limit || ''}
                    onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) || null })}
                    placeholder="Unlimited"
                  />
                </div>
                <div>
                  <Label htmlFor="per_user_limit">Per User Limit</Label>
                  <Input
                    id="per_user_limit"
                    type="number"
                    value={formData.per_user_limit || ''}
                    onChange={(e) => setFormData({ ...formData, per_user_limit: parseInt(e.target.value) || null })}
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valid_from">Valid From</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="valid_until">Valid Until</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/admin/coupons')}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                isEditing ? 'Update Coupon' : 'Create Coupon'
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminCouponForm;
