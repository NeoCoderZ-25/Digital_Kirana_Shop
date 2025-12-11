import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Plus, CreditCard, Banknote, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Address {
  id: string;
  label: string;
  address: string;
  is_default: boolean;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, totalPrice, orderNote, clearCart } = useCart();
  const { toast } = useToast();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [loading, setLoading] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: 'Home', address: '' });

  const deliveryCharge = totalPrice >= 499 ? 0 : 40;
  const finalTotal = totalPrice + deliveryCharge;

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

  const handleAddAddress = async () => {
    if (!newAddress.address.trim()) {
      toast({ title: 'Error', description: 'Please enter an address', variant: 'destructive' });
      return;
    }

    const { data, error } = await supabase
      .from('addresses')
      .insert({
        user_id: user?.id,
        label: newAddress.label,
        address: newAddress.address,
        is_default: addresses.length === 0,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: 'Failed to add address', variant: 'destructive' });
    } else {
      setAddresses([...addresses, data]);
      setSelectedAddress(data.id);
      setShowAddAddress(false);
      setNewAddress({ label: 'Home', address: '' });
      toast({ title: 'Success', description: 'Address added successfully' });
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

    setLoading(true);

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id,
          address_id: selectedAddress,
          total_price: finalTotal,
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'cod' ? 'pending' : 'pending',
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
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

      // Add order note if present
      if (orderNote.trim()) {
        await supabase
          .from('order_notes')
          .insert({
            order_id: order.id,
            user_note: orderNote,
          });
      }

      clearCart();
      toast({ title: 'Order placed!', description: 'Your order has been placed successfully.' });
      navigate('/orders');
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

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-32">
        <h1 className="text-2xl font-bold text-foreground mb-6">Checkout</h1>

        {/* Delivery Address */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Delivery Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {addresses.length > 0 && (
              <RadioGroup value={selectedAddress || ''} onValueChange={setSelectedAddress}>
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                      selectedAddress === addr.id ? 'border-primary bg-primary/5' : 'border-border'
                    )}
                    onClick={() => setSelectedAddress(addr.id)}
                  >
                    <RadioGroupItem value={addr.id} id={addr.id} className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor={addr.id} className="font-medium cursor-pointer">
                        {addr.label}
                        {addr.is_default && (
                          <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">{addr.address}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            )}

            {showAddAddress ? (
              <div className="space-y-3 p-3 border border-dashed border-border rounded-lg">
                <div>
                  <Label>Label</Label>
                  <Input
                    value={newAddress.label}
                    onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                    placeholder="Home, Work, etc."
                  />
                </div>
                <div>
                  <Label>Full Address</Label>
                  <Input
                    value={newAddress.address}
                    onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                    placeholder="Enter your full address"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddAddress} className="flex-1">Save Address</Button>
                  <Button variant="outline" onClick={() => setShowAddAddress(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowAddAddress(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Address
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'cod' | 'online')}>
              <div
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                  paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border'
                )}
                onClick={() => setPaymentMethod('cod')}
              >
                <RadioGroupItem value="cod" id="cod" />
                <Banknote className="w-5 h-5 text-success" />
                <Label htmlFor="cod" className="flex-1 cursor-pointer">
                  Cash on Delivery
                </Label>
              </div>
              <div
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer mt-2',
                  paymentMethod === 'online' ? 'border-primary bg-primary/5' : 'border-border'
                )}
                onClick={() => setPaymentMethod('online')}
              >
                <RadioGroupItem value="online" id="online" />
                <CreditCard className="w-5 h-5 text-primary" />
                <Label htmlFor="online" className="flex-1 cursor-pointer">
                  Pay Online
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Items ({items.length})</span>
              <span>₹{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery</span>
              <span className={cn(deliveryCharge === 0 ? 'text-success' : '')}>
                {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
              </span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>₹{finalTotal.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Place Order Button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-background border-t border-border">
        <Button
          onClick={handlePlaceOrder}
          disabled={loading || !selectedAddress}
          className="w-full h-12 text-lg font-semibold"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Placing Order...
            </>
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              Place Order - ₹{finalTotal.toFixed(2)}
            </>
          )}
        </Button>
      </div>
    </AppLayout>
  );
};

export default Checkout;
