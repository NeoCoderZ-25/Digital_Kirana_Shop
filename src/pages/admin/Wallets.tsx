import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Wallet, 
  Users, 
  TrendingUp, 
  Search, 
  Plus, 
  Minus, 
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface UserWallet {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  profile: {
    username: string;
    email: string;
    phone: string | null;
  } | null;
}

interface WalletTransaction {
  id: string;
  user_id: string;
  wallet_id: string;
  type: string;
  amount: number;
  description: string | null;
  reference_type: string | null;
  created_at: string;
  profile?: {
    username: string;
    email: string;
  } | null;
}

const AdminWallets = () => {
  const { toast } = useToast();
  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWallet, setSelectedWallet] = useState<UserWallet | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'credit' | 'debit'>('credit');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBalance: 0,
    totalCredits: 0,
    totalDebits: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all wallets
      const { data: walletsData, error: walletsError } = await supabase
        .from('wallets')
        .select('*')
        .order('balance', { ascending: false });

      if (walletsError) throw walletsError;

      // Fetch profiles for wallet users
      if (walletsData && walletsData.length > 0) {
        const userIds = walletsData.map(w => w.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, username, email, phone')
          .in('user_id', userIds);

        const walletsWithProfiles = walletsData.map(wallet => ({
          ...wallet,
          profile: profilesData?.find(p => p.user_id === wallet.user_id) || null,
        }));

        setWallets(walletsWithProfiles);

        // Calculate stats
        const totalBalance = walletsData.reduce((sum, w) => sum + Number(w.balance), 0);
        setStats(prev => ({
          ...prev,
          totalUsers: walletsData.length,
          totalBalance,
        }));
      }

      // Fetch recent transactions
      const { data: txData, error: txError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (txError) throw txError;

      if (txData && txData.length > 0) {
        const userIds = [...new Set(txData.map(t => t.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, username, email')
          .in('user_id', userIds);

        const txWithProfiles = txData.map(tx => ({
          ...tx,
          profile: profilesData?.find(p => p.user_id === tx.user_id) || null,
        }));

        setTransactions(txWithProfiles);

        // Calculate transaction stats
        const credits = txData.filter(t => t.type === 'credit').reduce((sum, t) => sum + Number(t.amount), 0);
        const debits = txData.filter(t => t.type === 'debit').reduce((sum, t) => sum + Number(t.amount), 0);
        setStats(prev => ({
          ...prev,
          totalCredits: credits,
          totalDebits: debits,
        }));
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
      toast({ title: 'Error', description: 'Failed to load wallet data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustWallet = async () => {
    if (!selectedWallet || !adjustmentAmount || Number(adjustmentAmount) <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    const amount = Number(adjustmentAmount);
    
    if (adjustmentType === 'debit' && amount > Number(selectedWallet.balance)) {
      toast({ title: 'Error', description: 'Insufficient wallet balance', variant: 'destructive' });
      return;
    }

    setAdjusting(true);
    try {
      const newBalance = adjustmentType === 'credit' 
        ? Number(selectedWallet.balance) + amount 
        : Number(selectedWallet.balance) - amount;

      // Update wallet balance
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', selectedWallet.id);

      if (updateError) throw updateError;

      // Create transaction record
      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: selectedWallet.user_id,
          wallet_id: selectedWallet.id,
          type: adjustmentType,
          amount: amount,
          description: adjustmentReason || `Admin ${adjustmentType}`,
          reference_type: 'admin_adjustment',
        });

      if (txError) throw txError;

      toast({ 
        title: 'Success', 
        description: `₹${amount} ${adjustmentType === 'credit' ? 'added to' : 'deducted from'} wallet` 
      });

      setDialogOpen(false);
      setAdjustmentAmount('');
      setAdjustmentReason('');
      fetchData();
    } catch (error) {
      console.error('Error adjusting wallet:', error);
      toast({ title: 'Error', description: 'Failed to adjust wallet', variant: 'destructive' });
    } finally {
      setAdjusting(false);
    }
  };

  const filteredWallets = wallets.filter(w => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      w.profile?.username?.toLowerCase().includes(search) ||
      w.profile?.email?.toLowerCase().includes(search) ||
      w.profile?.phone?.includes(search)
    );
  });

  const filteredTransactions = transactions.filter(tx => {
    if (filterType === 'all') return true;
    return tx.type === filterType;
  });

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
        <div>
          <h1 className="text-2xl font-bold text-foreground">Wallet Management</h1>
          <p className="text-muted-foreground">Manage user wallets and transactions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Balance</p>
                <p className="text-2xl font-bold">₹{stats.totalBalance.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Credits</p>
                <p className="text-2xl font-bold">₹{stats.totalCredits.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Debits</p>
                <p className="text-2xl font-bold">₹{stats.totalDebits.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="wallets">
          <TabsList>
            <TabsTrigger value="wallets">User Wallets</TabsTrigger>
            <TabsTrigger value="transactions">All Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="wallets" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="grid gap-4">
              {filteredWallets.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No wallets found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredWallets.map((wallet) => (
                  <Card key={wallet.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{wallet.profile?.username || 'Unknown User'}</p>
                            <p className="text-sm text-muted-foreground">{wallet.profile?.email}</p>
                            {wallet.profile?.phone && (
                              <p className="text-xs text-muted-foreground">{wallet.profile.phone}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Balance</p>
                            <p className="text-xl font-bold text-foreground">₹{Number(wallet.balance).toFixed(2)}</p>
                          </div>
                          <Dialog open={dialogOpen && selectedWallet?.id === wallet.id} onOpenChange={(open) => {
                            setDialogOpen(open);
                            if (open) setSelectedWallet(wallet);
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                Adjust
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Adjust Wallet Balance</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="p-3 bg-muted rounded-lg">
                                  <p className="text-sm text-muted-foreground">User</p>
                                  <p className="font-medium">{selectedWallet?.profile?.username}</p>
                                  <p className="text-sm text-muted-foreground">Current Balance: ₹{Number(selectedWallet?.balance || 0).toFixed(2)}</p>
                                </div>
                                <div>
                                  <Label>Adjustment Type</Label>
                                  <div className="flex gap-2 mt-2">
                                    <Button
                                      type="button"
                                      variant={adjustmentType === 'credit' ? 'default' : 'outline'}
                                      onClick={() => setAdjustmentType('credit')}
                                      className="flex-1"
                                    >
                                      <Plus className="w-4 h-4 mr-2" />
                                      Credit
                                    </Button>
                                    <Button
                                      type="button"
                                      variant={adjustmentType === 'debit' ? 'destructive' : 'outline'}
                                      onClick={() => setAdjustmentType('debit')}
                                      className="flex-1"
                                    >
                                      <Minus className="w-4 h-4 mr-2" />
                                      Debit
                                    </Button>
                                  </div>
                                </div>
                                <div>
                                  <Label>Amount (₹)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={adjustmentAmount}
                                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                                    placeholder="Enter amount"
                                  />
                                </div>
                                <div>
                                  <Label>Reason (optional)</Label>
                                  <Textarea
                                    value={adjustmentReason}
                                    onChange={(e) => setAdjustmentReason(e.target.value)}
                                    placeholder="Enter reason for adjustment"
                                  />
                                </div>
                                <Button onClick={handleAdjustWallet} disabled={adjusting} className="w-full">
                                  {adjusting ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    `${adjustmentType === 'credit' ? 'Add' : 'Deduct'} ₹${adjustmentAmount || '0'}`
                                  )}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <div className="flex items-center gap-4">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="credit">Credits Only</SelectItem>
                  <SelectItem value="debit">Debits Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredTransactions.length === 0 ? (
                    <div className="py-12 text-center">
                      <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No transactions found</p>
                    </div>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <div key={tx.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            tx.type === 'credit' ? 'bg-success/10' : 'bg-destructive/10'
                          }`}>
                            {tx.type === 'credit' ? (
                              <ArrowUpRight className="w-4 h-4 text-success" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4 text-destructive" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{tx.profile?.username || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{tx.description || tx.reference_type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${tx.type === 'credit' ? 'text-success' : 'text-destructive'}`}>
                            {tx.type === 'credit' ? '+' : '-'}₹{Number(tx.amount).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(tx.created_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminWallets;
