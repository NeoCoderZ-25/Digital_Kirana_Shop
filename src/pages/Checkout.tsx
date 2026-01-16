import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Plus, CreditCard, Banknote, QrCode, Check, Loader2, ChevronRight, Shield, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddressForm, AddressFormData } from '@/components/AddressForm';
import { AddressCard, Address } from '@/components/AddressCard';
import { PaymentQRCode } from '@/components/PaymentQRCode';
import CouponInput from '@/components/CouponInput';
import { LoyaltyRedemption } from '@/components/LoyaltyRedemption';

type PaymentMethod = 'cod' | 'qr';
type CheckoutStep = 'address' | 'payment' | 'review';

interface CouponData {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order_amount: number | null;
  max_discount: number | null;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, totalPrice, orderNote, clearCart } = useCart();
  const { toast } = useToast();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [loading, setLoading] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('address');
  const [showQRPayment, setShowQRPayment] = useState(false);
  
  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Loyalty points state
  const [pointsToUse, setPointsToUse] = useState(0);
  const [pointsDiscount, setPointsDiscount] = useState(0);

  const deliveryCharge = totalPrice >= 499 ? 0 : 40;
  const finalTotal = totalPrice + deliveryCharge - couponDiscount - pointsDiscount;

  const handleCouponApplied = (coupon: CouponData | null, discountAmount: number) => {
    setAppliedCoupon(coupon);
    setCouponDiscount(discountAmount);
  };

  const handlePointsChange = (points: number, discount: number) => {
    setPointsToUse(points);
    setPointsDiscount(discount);
  };

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user?.id)
      .order('is_default', { ascending: false });

    if (error) {
      console.error('Error fetching addresses:', error);
    } else {
      setAddresses(data || []);
      const defaultAddr = data?.find(a => a.is_default);
      if (defaultAddr) {
        setSelectedAddress(defaultAddr.id);
      } else if (data && data.length > 0) {
        setSelectedAddress(data[0].id);
      }
    }
  };

  const handleAddAddress = async (formData: AddressFormData) => {
    setAddingAddress(true);
    try {
      const { data, error } = await supabase
        .from('addresses')
        .insert({
          user_id: user?.id,
          label: formData.label,
          address: formData.address,
          phone: formData.phone,
          pincode: formData.pincode,
          city: formData.city,
          state: formData.state,
          landmark: formData.landmark,
          address_type: formData.address_type,
          is_default: addresses.length === 0,
        })
        .select()
        .single();

      if (error) throw error;

      setAddresses([...addresses, data]);
      setSelectedAddress(data.id);
      setShowAddAddress(false);
      toast({ title: 'Success', description: 'Address added successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add address', variant: 'destructive' });
    } finally {
      setAddingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', addressId);

    if (!error) {
      setAddresses(addresses.filter(a => a.id !== addressId));
      if (selectedAddress === addressId) {
        setSelectedAddress(addresses.find(a => a.id !== addressId)?.id || null);
      }
      toast({ title: 'Address deleted' });
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast({ title: 'Error', description: 'Please select a delivery address', variant: 'destructive' });
      return;
    }

    if (items.length === 0) {
      toast({ title: 'Error', description: 'Your cart is empty', variant: 'destructive' });
      return;
    }

    // If QR payment selected, show QR code first
    if (paymentMethod === 'qr' && !showQRPayment) {
      setShowQRPayment(true);
      return;
    }

    setLoading(true);

    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id,
          address_id: selectedAddress,
          total_price: finalTotal,
          payment_method: paymentMethod === 'qr' ? 'online' : 'cod',
          payment_status: paymentMethod === 'qr' ? 'pending_verification' : 'pending',
          status: 'pending',
          coupon_id: appliedCoupon?.id || null,
          coupon_discount: couponDiscount,
          points_used: pointsToUse,
          points_discount: pointsDiscount,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        variant_id: item.variantId || null,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Record coupon usage
      if (appliedCoupon) {
        await supabase.from('coupon_usage').insert({
          coupon_id: appliedCoupon.id,
          user_id: user?.id,
          order_id: order.id,
          discount_amount: couponDiscount,
        });
        
        // Increment used_count
        await supabase
          .from('coupons')
          .update({ used_count: (appliedCoupon as any).used_count + 1 })
          .eq('id', appliedCoupon.id);
      }

      // Handle loyalty points redemption
      if (pointsToUse > 0) {
        // Update user's loyalty points
        const { data: currentPoints } = await supabase
          .from('loyalty_points')
          .select('total_points, lifetime_spent')
          .eq('user_id', user?.id)
          .single();

        if (currentPoints) {
          await supabase
            .from('loyalty_points')
            .update({
              total_points: (currentPoints.total_points || 0) - pointsToUse,
              lifetime_spent: (currentPoints.lifetime_spent || 0) + pointsToUse,
            })
            .eq('user_id', user?.id);

          // Record loyalty transaction
          await supabase.from('loyalty_transactions').insert({
            user_id: user?.id,
            order_id: order.id,
            points: -pointsToUse,
            type: 'redeemed',
            description: `Redeemed ${pointsToUse} points for order #${order.id.slice(0, 8).toUpperCase()}`,
          });
        }
      }

      if (orderNote.trim()) {
        await supabase
          .from('order_notes')
          .insert({
            order_id: order.id,
            user_note: orderNote,
          });
      }

      clearCart();
      navigate(`/order-confirmation?orderId=${order.id}`);
    } catch (error) {
      console.error('Error placing order:', error);
      toast({ title: 'Error', description: 'Failed to place order. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const steps = [
    { key: 'address', label: 'Address', icon: MapPin },
    { key: 'payment', label: 'Payment', icon: CreditCard },
    { key: 'review', label: 'Review', icon: Check },
  ];

  const selectedAddressData = addresses.find(a => a.id === selectedAddress);

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-32">
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <div key={step.key} className="flex items-center">
              <button
                onClick={() => {
                  if (step.key === 'address' || (step.key === 'payment' && selectedAddress)) {
                    setCurrentStep(step.key as CheckoutStep);
                    setShowQRPayment(false);
                  }
                }}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-full transition-all',
                  currentStep === step.key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <step.icon className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
              </button>
              {index < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-muted-foreground mx-2" />
              )}
            </div>
          ))}
        </div>

        {/* Address Step */}
        {currentStep === 'address' && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-foreground mb-4">Select Delivery Address</h2>
            
            <div className="space-y-3 mb-4">
              {addresses.map((addr) => (
                <AddressCard
                  key={addr.id}
                  address={addr}
                  selected={selectedAddress === addr.id}
                  onSelect={() => setSelectedAddress(addr.id)}
                  onDelete={() => handleDeleteAddress(addr.id)}
                />
              ))}
            </div>

            {showAddAddress ? (
              <AddressForm
                onSubmit={handleAddAddress}
                onCancel={() => setShowAddAddress(false)}
                loading={addingAddress}
              />
            ) : (
              <Button
                variant="outline"
                className="w-full border-dashed border-2"
                onClick={() => setShowAddAddress(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Address
              </Button>
            )}

            <Button
              onClick={() => setCurrentStep('payment')}
              disabled={!selectedAddress}
              className="w-full mt-6 h-12 text-base font-semibold"
            >
              Continue to Payment
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}

        {/* Payment Step */}
        {currentStep === 'payment' && !showQRPayment && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-foreground mb-4">Select Payment Method</h2>

            {/* Selected Address Preview */}
            {selectedAddressData && (
              <Card className="mb-6 bg-secondary/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Truck className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Delivering to: {selectedAddressData.label}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{selectedAddressData.address}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep('address')}>
                      Change
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
              {/* COD Option */}
              <div
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer',
                  paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                )}
                onClick={() => setPaymentMethod('cod')}
              >
                <RadioGroupItem value="cod" id="cod" />
                <div className="p-3 rounded-xl bg-success/20">
                  <Banknote className="w-6 h-6 text-success" />
                </div>
                <div className="flex-1">
                  <Label htmlFor="cod" className="font-semibold cursor-pointer">Cash on Delivery</Label>
                  <p className="text-xs text-muted-foreground">Pay when you receive your order</p>
                </div>
              </div>

              {/* QR Code Payment Option */}
              <div
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer mt-3',
                  paymentMethod === 'qr' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                )}
                onClick={() => setPaymentMethod('qr')}
              >
                <RadioGroupItem value="qr" id="qr" />
                <div className="p-3 rounded-xl bg-primary/20">
                  <QrCode className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <Label htmlFor="qr" className="font-semibold cursor-pointer">UPI / QR Code</Label>
                  <p className="text-xs text-muted-foreground">Scan & pay using any UPI app</p>
                </div>
              </div>
            </RadioGroup>

            {/* Loyalty Points Redemption */}
            <div className="mt-6">
              <LoyaltyRedemption
                orderTotal={totalPrice + deliveryCharge - couponDiscount}
                onPointsChange={handlePointsChange}
              />
            </div>

            {/* Coupon Input */}
            <div className="mt-4">
              <CouponInput 
                orderTotal={totalPrice} 
                onCouponApplied={handleCouponApplied}
                appliedCoupon={appliedCoupon}
              />
            </div>

            {/* Security Badge */}
            <div className="flex items-center gap-2 mt-6 p-3 bg-success/10 rounded-lg">
              <Shield className="w-5 h-5 text-success" />
              <span className="text-sm text-success font-medium">100% Secure Payments</span>
            </div>

            <Button
              onClick={() => setCurrentStep('review')}
              className="w-full mt-6 h-12 text-base font-semibold"
            >
              Review Order
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}

        {/* QR Payment Screen */}
        {currentStep === 'payment' && showQRPayment && (
          <div className="animate-fade-in">
            <Button
              variant="ghost"
              onClick={() => setShowQRPayment(false)}
              className="mb-4"
            >
              ← Back to payment options
            </Button>
            <PaymentQRCode amount={finalTotal} onPaymentConfirmed={handlePlaceOrder} />
          </div>
        )}

        {/* Review Step */}
        {currentStep === 'review' && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-foreground mb-4">Review Your Order</h2>

            {/* Delivery Address */}
            {selectedAddressData && (
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="font-medium">{selectedAddressData.label}</p>
                  {selectedAddressData.phone && <p className="text-sm text-muted-foreground">+91 {selectedAddressData.phone}</p>}
                  <p className="text-sm text-muted-foreground">{selectedAddressData.address}</p>
                </CardContent>
              </Card>
            )}

            {/* Payment Method */}
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="font-medium">
                  {paymentMethod === 'cod' ? '💵 Cash on Delivery' : '📱 UPI / QR Code Payment'}
                </p>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Order Items ({items.length})</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                      <img src={item.imageUrl || '/placeholder.svg'} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold">₹{item.price * item.quantity}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Price Summary */}
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Price Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className={cn(deliveryCharge === 0 ? 'text-success' : '')}>
                    {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Coupon Discount</span>
                    <span>-₹{couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Points Discount ({pointsToUse} pts)</span>
                    <span>-₹{pointsDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{finalTotal.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Place Order Button - Only on Review Step */}
      {currentStep === 'review' && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background border-t border-border">
          <Button
            onClick={handlePlaceOrder}
            disabled={loading}
            className="w-full h-12 text-lg font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Placing Order...
              </>
            ) : (
              <>
                {paymentMethod === 'qr' ? (
                  <>
                    <QrCode className="w-5 h-5 mr-2" />
                    Pay ₹{finalTotal.toFixed(2)}
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Place Order - ₹{finalTotal.toFixed(2)}
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      )}
    </AppLayout>
  );
};

export default Checkout;