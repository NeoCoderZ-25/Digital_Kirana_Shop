import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWallet } from '@/hooks/useWallet';
import { Loader2, CreditCard, Smartphone } from 'lucide-react';

interface AddFundsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QUICK_AMOUNTS = [100, 200, 500, 1000];

export const AddFundsDialog = ({ open, onOpenChange }: AddFundsDialogProps) => {
  const { addFunds } = useWallet();
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'amount' | 'payment'>('amount');

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const handleProceed = () => {
    const numAmount = parseFloat(amount);
    if (numAmount >= 10) {
      setStep('payment');
    }
  };

  const handlePayment = async (method: 'upi' | 'card') => {
    const numAmount = parseFloat(amount);
    if (numAmount < 10) return;

    setLoading(true);
    
    // Simulate payment processing (dummy API)
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const success = await addFunds(numAmount);
    
    setLoading(false);
    
    if (success) {
      setAmount('');
      setStep('amount');
      onOpenChange(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setAmount('');
      setStep('amount');
    }
    onOpenChange(open);
  };

  const numAmount = parseFloat(amount) || 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Money to Wallet</DialogTitle>
          <DialogDescription>
            {step === 'amount' 
              ? 'Enter the amount you want to add' 
              : 'Choose a payment method'}
          </DialogDescription>
        </DialogHeader>

        {step === 'amount' ? (
          <div className="space-y-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-medium">₹</span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="pl-8 text-2xl h-14 font-bold"
                min={10}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant={amount === quickAmount.toString() ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleQuickAmount(quickAmount)}
                >
                  ₹{quickAmount}
                </Button>
              ))}
            </div>

            {numAmount > 0 && numAmount < 10 && (
              <p className="text-sm text-destructive">Minimum amount is ₹10</p>
            )}

            <Button 
              className="w-full" 
              onClick={handleProceed}
              disabled={numAmount < 10}
            >
              Proceed to Pay ₹{numAmount || 0}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Amount to add</p>
              <p className="text-2xl font-bold">₹{numAmount}</p>
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-14"
                onClick={() => handlePayment('upi')}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Smartphone className="w-5 h-5 text-primary" />
                )}
                <div className="text-left">
                  <p className="font-medium">UPI</p>
                  <p className="text-xs text-muted-foreground">Google Pay, PhonePe, Paytm</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-14"
                onClick={() => handlePayment('card')}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CreditCard className="w-5 h-5 text-primary" />
                )}
                <div className="text-left">
                  <p className="font-medium">Credit / Debit Card</p>
                  <p className="text-xs text-muted-foreground">Visa, Mastercard, RuPay</p>
                </div>
              </Button>
            </div>

            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => setStep('amount')}
              disabled={loading}
            >
              Change Amount
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddFundsDialog;
