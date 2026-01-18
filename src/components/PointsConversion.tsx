import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Coins, ArrowRight, Wallet, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { toast } from '@/hooks/use-toast';

interface LoyaltyRule {
  currency_per_point: number;
  min_points_to_convert: number;
  return_window_minutes: number;
}

interface PendingPoints {
  orderId: string;
  points: number;
  availableAt: Date;
}

export const PointsConversion = () => {
  const { user } = useAuth();
  const { convertPointsToWallet } = useWallet();
  const [availablePoints, setAvailablePoints] = useState(0);
  const [pendingPoints, setPendingPoints] = useState<PendingPoints[]>([]);
  const [selectedPoints, setSelectedPoints] = useState(0);
  const [rule, setRule] = useState<LoyaltyRule>({
    currency_per_point: 0.01,
    min_points_to_convert: 100,
    return_window_minutes: 30,
  });
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch loyalty points
      const { data: loyaltyData } = await supabase
        .from('loyalty_points')
        .select('total_points')
        .eq('user_id', user?.id)
        .single();

      if (loyaltyData) {
        setAvailablePoints(loyaltyData.total_points || 0);
      }

      // Fetch redemption rule
      const { data: ruleData } = await supabase
        .from('loyalty_rules')
        .select('*')
        .eq('rule_type', 'redeem')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (ruleData) {
        setRule({
          currency_per_point: Number(ruleData.currency_per_point) || 0.01,
          min_points_to_convert: ruleData.min_points_to_convert || 100,
          return_window_minutes: ruleData.return_window_minutes || 30,
        });
      }

      // Check for pending points (orders delivered within return window)
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('id, points_earned, can_return_until')
        .eq('user_id', user?.id)
        .eq('status', 'delivered')
        .not('can_return_until', 'is', null)
        .gt('can_return_until', new Date().toISOString());

      if (recentOrders) {
        const pending = recentOrders
          .filter((o) => o.points_earned && o.points_earned > 0)
          .map((o) => ({
            orderId: o.id,
            points: o.points_earned || 0,
            availableAt: new Date(o.can_return_until!),
          }));
        setPendingPoints(pending);
      }
    } catch (error) {
      console.error('Error fetching conversion data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    if (selectedPoints < rule.min_points_to_convert) {
      toast({
        title: 'Minimum Points Required',
        description: `You need at least ${rule.min_points_to_convert} points to convert`,
        variant: 'destructive',
      });
      return;
    }

    setConverting(true);
    const success = await convertPointsToWallet(selectedPoints, rule.currency_per_point);
    
    if (success) {
      setSelectedPoints(0);
      await fetchData();
    }
    setConverting(false);
  };

  const walletAmount = selectedPoints * rule.currency_per_point;
  const canConvert = availablePoints >= rule.min_points_to_convert;
  const totalPendingPoints = pendingPoints.reduce((sum, p) => sum + p.points, 0);

  if (loading) {
    return null;
  }

  if (availablePoints === 0 && pendingPoints.length === 0) {
    return null;
  }

  return (
    <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Coins className="w-5 h-5 text-yellow-500" />
          Convert Points to Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Available Points</p>
            <p className="text-2xl font-bold">{availablePoints.toLocaleString()}</p>
          </div>
          <Badge variant="secondary">
            Worth ₹{(availablePoints * rule.currency_per_point).toFixed(2)}
          </Badge>
        </div>

        {pendingPoints.length > 0 && (
          <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                {totalPendingPoints} points pending
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Points from recent orders will be available after {rule.return_window_minutes} min return window
            </p>
          </div>
        )}

        {!canConvert ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            Minimum {rule.min_points_to_convert} points required to convert
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Points to convert</span>
                <span className="font-medium">{selectedPoints.toLocaleString()}</span>
              </div>
              <Slider
                value={[selectedPoints]}
                onValueChange={(v) => setSelectedPoints(v[0])}
                max={availablePoints}
                min={0}
                step={10}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0</span>
                <span>{availablePoints.toLocaleString()}</span>
              </div>
            </div>

            {selectedPoints > 0 && (
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  <span className="font-medium">{selectedPoints.toLocaleString()}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  <span className="font-bold text-primary">₹{walletAmount.toFixed(2)}</span>
                </div>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleConvert}
              disabled={selectedPoints < rule.min_points_to_convert || converting}
            >
              {converting ? 'Converting...' : `Convert to ₹${walletAmount.toFixed(2)}`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PointsConversion;
