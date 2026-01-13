import { useState, useEffect } from 'react';
import { Award, Star, ChevronRight, TrendingUp, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface LoyaltyPoints {
  total_points: number;
  lifetime_earned: number;
  lifetime_spent: number;
  tier: string;
}

interface LoyaltyTransaction {
  id: string;
  points: number;
  type: string;
  description: string | null;
  created_at: string;
}

interface LoyaltySettings {
  point_value: number;
  min_redeem_points: number;
}

const tierColors: Record<string, { bg: string; text: string; icon: string }> = {
  bronze: { bg: 'bg-amber-100', text: 'text-amber-700', icon: '🥉' },
  silver: { bg: 'bg-slate-200', text: 'text-slate-700', icon: '🥈' },
  gold: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '🥇' },
  platinum: { bg: 'bg-purple-100', text: 'text-purple-700', icon: '💎' },
};

const tierThresholds = {
  bronze: 0,
  silver: 500,
  gold: 2000,
  platinum: 5000,
};

const LoyaltyCard = () => {
  const { user } = useAuth();
  const [loyalty, setLoyalty] = useState<LoyaltyPoints | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLoyaltyData();
    }
  }, [user]);

  const fetchLoyaltyData = async () => {
    try {
      // Fetch or create loyalty points
      let { data: loyaltyData, error: loyaltyError } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!loyaltyData && !loyaltyError) {
        // Create new loyalty record for user
        const { data: newLoyalty } = await supabase
          .from('loyalty_points')
          .insert({ user_id: user?.id })
          .select()
          .single();
        loyaltyData = newLoyalty;
      }

      if (loyaltyData) {
        setLoyalty(loyaltyData);
      }

      // Fetch transactions
      const { data: transactionsData } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setTransactions(transactionsData || []);

      // Fetch settings
      const { data: settingsData } = await supabase
        .from('loyalty_settings')
        .select('point_value, min_redeem_points')
        .limit(1)
        .maybeSingle();

      setSettings(settingsData);
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !loyalty) {
    return null;
  }

  const tier = loyalty.tier || 'bronze';
  const tierStyle = tierColors[tier] || tierColors.bronze;
  const nextTier = tier === 'bronze' ? 'silver' : tier === 'silver' ? 'gold' : tier === 'gold' ? 'platinum' : null;
  const nextTierThreshold = nextTier ? tierThresholds[nextTier] : 0;
  const currentTierThreshold = tierThresholds[tier as keyof typeof tierThresholds] || 0;
  const progressToNext = nextTier 
    ? ((loyalty.lifetime_earned - currentTierThreshold) / (nextTierThreshold - currentTierThreshold)) * 100 
    : 100;

  const pointValue = settings?.point_value || 0.25;

  return (
    <Card className="overflow-hidden">
      <div className={cn("p-4", tierStyle.bg)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{tierStyle.icon}</div>
            <div>
              <Badge className={cn("mb-1", tierStyle.bg, tierStyle.text, "border-0")}>
                {tier.charAt(0).toUpperCase() + tier.slice(1)} Member
              </Badge>
              <h3 className={cn("text-2xl font-bold", tierStyle.text)}>
                {loyalty.total_points.toLocaleString()} Points
              </h3>
              <p className="text-sm text-muted-foreground">
                Worth ₹{(loyalty.total_points * pointValue).toFixed(2)}
              </p>
            </div>
          </div>
          <Award className={cn("w-12 h-12", tierStyle.text)} />
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Progress to next tier */}
        {nextTier && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress to {nextTier}</span>
              <span className="font-medium">{loyalty.lifetime_earned}/{nextTierThreshold}</span>
            </div>
            <Progress value={progressToNext} className="h-2" />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-success" />
            <div>
              <p className="text-xs text-muted-foreground">Total Earned</p>
              <p className="font-semibold">{loyalty.lifetime_earned.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Gift className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Redeemed</p>
              <p className="font-semibold">{loyalty.lifetime_spent.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              View History
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Points History</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No transactions yet</p>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">
                        {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={cn(
                      "font-bold",
                      tx.points > 0 ? "text-success" : "text-destructive"
                    )}>
                      {tx.points > 0 ? '+' : ''}{tx.points}
                    </span>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default LoyaltyCard;
