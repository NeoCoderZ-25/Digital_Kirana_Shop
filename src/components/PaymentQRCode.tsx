import { useState, useEffect } from 'react';
import { QrCode, Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PaymentQRCodeProps {
  amount: number;
  onPaymentConfirmed: () => void;
}

interface QRCodeData {
  id: string;
  name: string;
  upi_id: string | null;
  qr_image_url: string | null;
}

export const PaymentQRCode = ({ amount, onPaymentConfirmed }: PaymentQRCodeProps) => {
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchQRCode();
  }, []);

  const fetchQRCode = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_qr_codes')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching QR code:', error);
      }
      setQrData(data);
    } catch (error) {
      console.error('Failed to fetch QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUPI = async () => {
    if (qrData?.upi_id) {
      await navigator.clipboard.writeText(qrData.upi_id);
      setCopied(true);
      toast({ title: 'UPI ID copied!', description: 'Paste in your UPI app' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConfirmPayment = () => {
    setConfirming(true);
    // Simulate confirmation delay
    setTimeout(() => {
      onPaymentConfirmed();
    }, 1000);
  };

  if (loading) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading payment options...</p>
        </CardContent>
      </Card>
    );
  }

  if (!qrData) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px]">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <p className="text-foreground font-medium text-center">Online payment not available</p>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Please select Cash on Delivery or contact support.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-b from-primary/5 to-transparent overflow-hidden">
      <CardContent className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <QrCode className="w-5 h-5" />
            <span className="font-semibold">Scan & Pay</span>
          </div>
          <p className="text-3xl font-bold text-foreground">₹{amount.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground mt-1">{qrData.name}</p>
        </div>

        {/* QR Code Image */}
        {qrData.qr_image_url ? (
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-card rounded-2xl shadow-lg border border-border">
              <img
                src={qrData.qr_image_url}
                alt="Payment QR Code"
                className="w-48 h-48 object-contain"
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-6">
            <div className="w-48 h-48 bg-muted rounded-2xl flex items-center justify-center">
              <QrCode className="w-24 h-24 text-muted-foreground" />
            </div>
          </div>
        )}

        {/* UPI ID */}
        {qrData.upi_id && (
          <div className="mb-6">
            <p className="text-xs text-muted-foreground text-center mb-2">Or pay using UPI ID</p>
            <div className="flex items-center gap-2 bg-secondary rounded-lg p-3">
              <span className="flex-1 text-sm font-mono text-foreground truncate">
                {qrData.upi_id}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopyUPI}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-accent/10 rounded-xl p-4 mb-6">
          <p className="text-sm font-medium text-foreground mb-2">How to pay:</p>
          <ol className="text-xs text-muted-foreground space-y-1">
            <li>1. Open any UPI app (GPay, PhonePe, Paytm)</li>
            <li>2. Scan the QR code or use UPI ID</li>
            <li>3. Enter amount: ₹{amount.toFixed(2)}</li>
            <li>4. Complete payment and click confirm below</li>
          </ol>
        </div>

        {/* Confirm Button */}
        <Button
          onClick={handleConfirmPayment}
          disabled={confirming}
          className="w-full h-12 text-base font-semibold"
        >
          {confirming ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              I have completed the payment
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center mt-3">
          Your order will be confirmed after payment verification
        </p>
      </CardContent>
    </Card>
  );
};