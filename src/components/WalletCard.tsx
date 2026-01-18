import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useWallet, WalletTransaction } from '@/hooks/useWallet';
import { format } from 'date-fns';
import { useState } from 'react';
import { AddFundsDialog } from './AddFundsDialog';
import { Skeleton } from '@/components/ui/skeleton';

export const WalletCard = () => {
  const { wallet, transactions, loading } = useWallet();
  const [showAddFunds, setShowAddFunds] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-24 mb-4" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  const balance = wallet?.balance || 0;

  return (
    <>
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            My Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-3xl font-bold text-primary">₹{Number(balance).toFixed(2)}</p>
            </div>
            <Button onClick={() => setShowAddFunds(true)} size="sm" className="gap-1">
              <Plus className="w-4 h-4" />
              Add Money
            </Button>
          </div>

          {transactions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Recent Transactions</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {transactions.slice(0, 5).map((tx) => (
                  <TransactionItem key={tx.id} transaction={tx} />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AddFundsDialog open={showAddFunds} onOpenChange={setShowAddFunds} />
    </>
  );
};

const TransactionItem = ({ transaction }: { transaction: WalletTransaction }) => {
  const isCredit = transaction.type === 'credit';

  return (
    <div className="flex items-center justify-between p-2 bg-background rounded-lg border">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-full ${isCredit ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
          {isCredit ? (
            <ArrowDownLeft className="w-3 h-3 text-green-600" />
          ) : (
            <ArrowUpRight className="w-3 h-3 text-red-600" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium">{transaction.description || 'Transaction'}</p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(transaction.created_at), 'MMM d, h:mm a')}
          </p>
        </div>
      </div>
      <span className={`font-medium ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
        {isCredit ? '+' : '-'}₹{Number(transaction.amount).toFixed(2)}
      </span>
    </div>
  );
};

export default WalletCard;
