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
  Award, 
  Users, 
  TrendingUp, 
  Search, 
  Plus, 
  Minus, 
  Loader2,
  Star,
  Gift,
  Calendar,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface UserPoints {
  id: string;
  user_id: string;
  total_points: number;
  lifetime_earned: number;
  lifetime_spent: number;
  tier: string;
  profile: {
    username: string;
    email: string;
    phone: string | null;
  } | null;
}

interface PointsTransaction {
  id: string;
  user_id: string;
  points: number;
  type: string;
  description: string | null;
  created_at: string;
  profile?: {
    username: string;
    email: string;
  } | null;
}

const AdminPoints = () => {
  const { toast } = useToast();
  const [userPoints, setUserPoints] = useState<UserPoints[]>([]);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserPoints | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
  const [adjustmentPoints, setAdjustmentPoints] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPoints: 0,
    totalEarned: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all user points
      const { data: pointsData, error: pointsError } = await supabase
        .from('loyalty_points')
        .select('*')
        .order('total_points', { ascending: false });

      if (pointsError) throw pointsError;

      if (pointsData && pointsData.length > 0) {
        const userIds = pointsData.map(p => p.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, username, email, phone')
          .in('user_id', userIds);

        const pointsWithProfiles = pointsData.map(points => ({
          ...points,
          profile: profilesData?.find(p => p.user_id === points.user_id) || null,
        }));

        setUserPoints(pointsWithProfiles);

        // Calculate stats
        setStats({
          totalUsers: pointsData.length,
          totalPoints: pointsData.reduce((sum, p) => sum + (p.total_points || 0), 0),
          totalEarned: pointsData.reduce((sum, p) => sum + (p.lifetime_earned || 0), 0),
          totalSpent: pointsData.reduce((sum, p) => sum + (p.lifetime_spent || 0), 0),
        });
      }

      // Fetch recent transactions
      const { data: txData, error: txError } = await supabase
        .from('loyalty_transactions')
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
      }
    } catch (error) {
      console.error('Error fetching points:', error);
      toast({ title: 'Error', description: 'Failed to load points data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustPoints = async () => {
    if (!selectedUser || !adjustmentPoints || Number(adjustmentPoints) <= 0) {
      toast({ title: 'Error', description: 'Please enter valid points', variant: 'destructive' });
      return;
    }

    const points = Number(adjustmentPoints);
    
    if (adjustmentType === 'remove' && points > (selectedUser.total_points || 0)) {
      toast({ title: 'Error', description: 'Insufficient points balance', variant: 'destructive' });
      return;
    }

    setAdjusting(true);
    try {
      const newTotal = adjustmentType === 'add' 
        ? (selectedUser.total_points || 0) + points 
        : (selectedUser.total_points || 0) - points;

      const newLifetimeEarned = adjustmentType === 'add'
        ? (selectedUser.lifetime_earned || 0) + points
        : selectedUser.lifetime_earned;

      const newLifetimeSpent = adjustmentType === 'remove'
        ? (selectedUser.lifetime_spent || 0) + points
        : selectedUser.lifetime_spent;

      // Update points
      const { error: updateError } = await supabase
        .from('loyalty_points')
        .update({ 
          total_points: newTotal,
          lifetime_earned: newLifetimeEarned,
          lifetime_spent: newLifetimeSpent,
          updated_at: new Date().toISOString() 
        })
        .eq('id', selectedUser.id);

      if (updateError) throw updateError;

      // Create transaction record
      const { error: txError } = await supabase
        .from('loyalty_transactions')
        .insert({
          user_id: selectedUser.user_id,
          points: adjustmentType === 'add' ? points : -points,
          type: adjustmentType === 'add' ? 'admin_credit' : 'admin_debit',
          description: adjustmentReason || `Admin ${adjustmentType === 'add' ? 'added' : 'removed'} points`,
        });

      if (txError) throw txError;

      toast({ 
        title: 'Success', 
        description: `${points} points ${adjustmentType === 'add' ? 'added to' : 'removed from'} user` 
      });

      setDialogOpen(false);
      setAdjustmentPoints('');
      setAdjustmentReason('');
      fetchData();
    } catch (error) {
      console.error('Error adjusting points:', error);
      toast({ title: 'Error', description: 'Failed to adjust points', variant: 'destructive' });
    } finally {
      setAdjusting(false);
    }
  };

  const filteredUsers = userPoints.filter(u => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      u.profile?.username?.toLowerCase().includes(search) ||
      u.profile?.email?.toLowerCase().includes(search) ||
      u.profile?.phone?.includes(search)
    );
  });

  const filteredTransactions = transactions.filter(tx => {
    if (filterType === 'all') return true;
    if (filterType === 'earned') return tx.points > 0;
    if (filterType === 'spent') return tx.points < 0;
    return true;
  });

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'gold': return 'bg-yellow-500/10 text-yellow-600';
      case 'silver': return 'bg-gray-400/10 text-gray-600';
      case 'platinum': return 'bg-purple-500/10 text-purple-600';
      default: return 'bg-amber-600/10 text-amber-700';
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
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Points Management</h1>
          <p className="text-muted-foreground">Manage user loyalty points</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Members</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Award className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Points</p>
                <p className="text-2xl font-bold">{stats.totalPoints.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-2xl font-bold">{stats.totalEarned.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Gift className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Redeemed</p>
                <p className="text-2xl font-bold">{stats.totalSpent.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">User Points</TabsTrigger>
            <TabsTrigger value="transactions">All Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
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
              {filteredUsers.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No users found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredUsers.map((user) => (
                  <Card key={user.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Award className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{user.profile?.username || 'Unknown User'}</p>
                              <Badge variant="outline" className={getTierColor(user.tier || 'bronze')}>
                                {user.tier || 'Bronze'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{user.profile?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Points</p>
                            <p className="text-xl font-bold text-foreground">{(user.total_points || 0).toLocaleString()}</p>
                          </div>
                          <Dialog open={dialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                            setDialogOpen(open);
                            if (open) setSelectedUser(user);
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                Adjust
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Adjust Loyalty Points</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="p-3 bg-muted rounded-lg">
                                  <p className="text-sm text-muted-foreground">User</p>
                                  <p className="font-medium">{selectedUser?.profile?.username}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Current Points: {(selectedUser?.total_points || 0).toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <Label>Adjustment Type</Label>
                                  <div className="flex gap-2 mt-2">
                                    <Button
                                      type="button"
                                      variant={adjustmentType === 'add' ? 'default' : 'outline'}
                                      onClick={() => setAdjustmentType('add')}
                                      className="flex-1"
                                    >
                                      <Plus className="w-4 h-4 mr-2" />
                                      Add
                                    </Button>
                                    <Button
                                      type="button"
                                      variant={adjustmentType === 'remove' ? 'destructive' : 'outline'}
                                      onClick={() => setAdjustmentType('remove')}
                                      className="flex-1"
                                    >
                                      <Minus className="w-4 h-4 mr-2" />
                                      Remove
                                    </Button>
                                  </div>
                                </div>
                                <div>
                                  <Label>Points</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={adjustmentPoints}
                                    onChange={(e) => setAdjustmentPoints(e.target.value)}
                                    placeholder="Enter points"
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
                                <Button onClick={handleAdjustPoints} disabled={adjusting} className="w-full">
                                  {adjusting ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    `${adjustmentType === 'add' ? 'Add' : 'Remove'} ${adjustmentPoints || '0'} Points`
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
                  <SelectItem value="earned">Earned</SelectItem>
                  <SelectItem value="spent">Spent/Redeemed</SelectItem>
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
                            tx.points > 0 ? 'bg-success/10' : 'bg-orange-500/10'
                          }`}>
                            {tx.points > 0 ? (
                              <Star className="w-4 h-4 text-success" />
                            ) : (
                              <Gift className="w-4 h-4 text-orange-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{tx.profile?.username || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{tx.description || tx.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${tx.points > 0 ? 'text-success' : 'text-orange-500'}`}>
                            {tx.points > 0 ? '+' : ''}{tx.points} pts
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

export default AdminPoints;
