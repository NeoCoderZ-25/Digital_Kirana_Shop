import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  wallet_id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string | null;
  reference_type: 'order' | 'refund' | 'topup' | 'points_conversion' | 'admin_adjustment' | null;
  reference_id: string | null;
  created_at: string;
}

export const useWallet = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWallet = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Try to get existing wallet
      let { data: walletData, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // If no wallet exists, create one
      if (error && error.code === 'PGRST116') {
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({ user_id: user.id, balance: 0 })
          .select()
          .single();

        if (createError) throw createError;
        walletData = newWallet;
      } else if (error) {
        throw error;
      }

      setWallet(walletData);

      // Fetch transactions
      const { data: txData } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setTransactions((txData as WalletTransaction[]) || []);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const addFunds = async (amount: number): Promise<boolean> => {
    if (!user || !wallet) return false;

    try {
      // Update wallet balance
      const newBalance = Number(wallet.balance) + amount;
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('id', wallet.id);

      if (updateError) throw updateError;

      // Create transaction record
      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          wallet_id: wallet.id,
          type: 'credit',
          amount: amount,
          description: 'Added funds to wallet',
          reference_type: 'topup',
        });

      if (txError) throw txError;

      await fetchWallet();
      toast({
        title: 'Success',
        description: `₹${amount} added to your wallet`,
      });
      return true;
    } catch (error) {
      console.error('Error adding funds:', error);
      toast({
        title: 'Error',
        description: 'Failed to add funds',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deductFunds = async (
    amount: number,
    description: string,
    referenceType: WalletTransaction['reference_type'],
    referenceId?: string
  ): Promise<boolean> => {
    if (!user || !wallet) return false;

    if (Number(wallet.balance) < amount) {
      toast({
        title: 'Insufficient Balance',
        description: 'Your wallet balance is not enough',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const newBalance = Number(wallet.balance) - amount;
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('id', wallet.id);

      if (updateError) throw updateError;

      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          wallet_id: wallet.id,
          type: 'debit',
          amount: amount,
          description,
          reference_type: referenceType,
          reference_id: referenceId,
        });

      if (txError) throw txError;

      await fetchWallet();
      return true;
    } catch (error) {
      console.error('Error deducting funds:', error);
      return false;
    }
  };

  const convertPointsToWallet = async (points: number, conversionRate: number): Promise<boolean> => {
    if (!user || !wallet) return false;

    const amount = points * conversionRate;

    try {
      // Update wallet balance
      const newBalance = Number(wallet.balance) + amount;
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('id', wallet.id);

      if (updateError) throw updateError;

      // Create wallet transaction
      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          wallet_id: wallet.id,
          type: 'credit',
          amount: amount,
          description: `Converted ${points} loyalty points`,
          reference_type: 'points_conversion',
        });

      if (txError) throw txError;

      // Deduct loyalty points
      const { data: loyaltyData } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (loyaltyData) {
        await supabase
          .from('loyalty_points')
          .update({
            total_points: (loyaltyData.total_points || 0) - points,
            lifetime_spent: (loyaltyData.lifetime_spent || 0) + points,
          })
          .eq('user_id', user.id);

        // Create loyalty transaction
        await supabase
          .from('loyalty_transactions')
          .insert({
            user_id: user.id,
            points: -points,
            type: 'redeemed',
            description: `Converted to ₹${amount.toFixed(2)} wallet balance`,
          });
      }

      await fetchWallet();
      toast({
        title: 'Points Converted',
        description: `${points} points converted to ₹${amount.toFixed(2)}`,
      });
      return true;
    } catch (error) {
      console.error('Error converting points:', error);
      toast({
        title: 'Error',
        description: 'Failed to convert points',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    wallet,
    transactions,
    loading,
    addFunds,
    deductFunds,
    convertPointsToWallet,
    refetch: fetchWallet,
  };
};
