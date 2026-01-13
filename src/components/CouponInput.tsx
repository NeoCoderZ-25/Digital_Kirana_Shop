import { useState } from 'react';
import { Tag, X, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface CouponData {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order_amount: number | null;
  max_discount: number | null;
}

interface CouponInputProps {
  orderTotal: number;
  onCouponApplied: (coupon: CouponData | null, discountAmount: number) => void;
  appliedCoupon: CouponData | null;
}

const CouponInput = ({ orderTotal, onCouponApplied, appliedCoupon }: CouponInputProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(!appliedCoupon);

  const calculateDiscount = (coupon: CouponData): number => {
    let discount = 0;
    
    if (coupon.discount_type === 'percentage') {
      discount = (orderTotal * coupon.discount_value) / 100;
      if (coupon.max_discount && discount > coupon.max_discount) {
        discount = coupon.max_discount;
      }
    } else {
      discount = coupon.discount_value;
    }
    
    return Math.min(discount, orderTotal);
  };

  const handleApplyCoupon = async () => {
    if (!code.trim()) {
      toast({ title: 'Please enter a coupon code', variant: 'destructive' });
      return;
    }

    if (!user) {
      toast({ title: 'Please login to apply coupons', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      // Fetch coupon
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!coupon) {
        toast({ title: 'Invalid coupon code', variant: 'destructive' });
        setLoading(false);
        return;
      }

      // Check validity period
      const now = new Date();
      if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        toast({ title: 'This coupon is not yet active', variant: 'destructive' });
        setLoading(false);
        return;
      }
      
      if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        toast({ title: 'This coupon has expired', variant: 'destructive' });
        setLoading(false);
        return;
      }

      // Check minimum order amount
      if (coupon.min_order_amount && orderTotal < coupon.min_order_amount) {
        toast({ 
          title: 'Minimum order not met', 
          description: `Add ₹${(coupon.min_order_amount - orderTotal).toFixed(2)} more to use this coupon`,
          variant: 'destructive' 
        });
        setLoading(false);
        return;
      }

      // Check usage limit
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        toast({ title: 'This coupon has been fully redeemed', variant: 'destructive' });
        setLoading(false);
        return;
      }

      // Check per-user limit
      if (coupon.per_user_limit) {
        const { count } = await supabase
          .from('coupon_usage')
          .select('*', { count: 'exact', head: true })
          .eq('coupon_id', coupon.id)
          .eq('user_id', user.id);

        if (count && count >= coupon.per_user_limit) {
          toast({ title: 'You have already used this coupon', variant: 'destructive' });
          setLoading(false);
          return;
        }
      }

      const discountAmount = calculateDiscount(coupon);
      onCouponApplied(coupon, discountAmount);
      setShowInput(false);
      toast({ 
        title: 'Coupon applied!', 
        description: `You saved ₹${discountAmount.toFixed(2)}` 
      });
    } catch (error) {
      console.error('Error applying coupon:', error);
      toast({ title: 'Error applying coupon', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    onCouponApplied(null, 0);
    setCode('');
    setShowInput(true);
  };

  if (appliedCoupon && !showInput) {
    return (
      <Card className="border-success/50 bg-success/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/20 rounded-lg">
                <Check className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="font-medium text-success">{appliedCoupon.code}</p>
                <p className="text-sm text-muted-foreground">
                  {appliedCoupon.discount_type === 'percentage' 
                    ? `${appliedCoupon.discount_value}% off` 
                    : `₹${appliedCoupon.discount_value} off`}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleRemoveCoupon}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-5 h-5 text-primary" />
          <span className="font-medium text-foreground">Apply Coupon</span>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Enter coupon code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="flex-1"
          />
          <Button onClick={handleApplyCoupon} disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Apply'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CouponInput;
