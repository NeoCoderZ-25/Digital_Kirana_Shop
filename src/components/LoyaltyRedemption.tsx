import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Gift, Coins, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface LoyaltySettings {
  point_value: number;
  min_redeem_points: number;
  max_redeem_percentage: number;
}

interface LoyaltyRedemptionProps {
  orderTotal: number;
  onPointsChange: (points: number, discount: number) => void;
}

export const LoyaltyRedemption = ({ orderTotal, onPointsChange }: LoyaltyRedemptionProps) => {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [availablePoints, setAvailablePoints] = useState(0);
  const [selectedPoints, setSelectedPoints] = useState(0);
  const [settings, setSettings] = useState<LoyaltySettings>({
    point_value: 0.25,
    min_redeem_points: 100,
    max_redeem_percentage: 50,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLoyaltyData();
    }
  }, [user]);

  const fetchLoyaltyData = async () => {
    try {
      // Fetch user's loyalty points
      const { data: pointsData } = await supabase
        .from('loyalty_points')
        .select('total_points')
        .eq('user_id', user?.id)
        .single();

      if (pointsData) {
        setAvailablePoints(pointsData.total_points || 0);
      }

      // Fetch loyalty settings
      const { data: settingsData } = await supabase
        .from('loyalty_settings')
        .select('*')
        .limit(1)
        .single();

      if (settingsData) {
        setSettings({
          point_value: Number(settingsData.point_value) || 0.25,
          min_redeem_points: settingsData.min_redeem_points || 100,
          max_redeem_percentage: Number(settingsData.max_redeem_percentage) || 50,
        });
      }
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate max redeemable points based on order total and settings
  const maxOrderDiscount = (orderTotal * settings.max_redeem_percentage) / 100;
  const maxPointsForDiscount = Math.floor(maxOrderDiscount / settings.point_value);
  const maxRedeemablePoints = Math.min(availablePoints, maxPointsForDiscount);

  // Calculate discount value
  const discountValue = selectedPoints * settings.point_value;

  // Check if user can redeem
  const canRedeem = availablePoints >= settings.min_redeem_points;

  const handleToggle = (enabled: boolean) => {
    setIsEnabled(enabled);
    if (!enabled) {
      setSelectedPoints(0);
      onPointsChange(0, 0);
    }
  };

  const handleSliderChange = (value: number[]) => {
    const points = value[0];
    setSelectedPoints(points);
    onPointsChange(points, points * settings.point_value);
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4 h-24" />
      </Card>
    );
  }

  if (availablePoints === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          Loyalty Points
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="font-medium">{availablePoints.toLocaleString()} points</span>
            <Badge variant="secondary" className="text-xs">
              Worth ₹{(availablePoints * settings.point_value).toFixed(2)}
            </Badge>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={!canRedeem}
          />
        </div>

        {!canRedeem && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
            <AlertCircle className="w-4 h-4" />
            Minimum {settings.min_redeem_points} points required to redeem
          </div>
        )}

        {isEnabled && canRedeem && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Points to redeem:</span>
              <span className="font-medium">{selectedPoints.toLocaleString()}</span>
            </div>
            
            <Slider
              value={[selectedPoints]}
              onValueChange={handleSliderChange}
              max={maxRedeemablePoints}
              min={0}
              step={10}
              className="w-full"
            />
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">0</span>
              <span className="text-muted-foreground">{maxRedeemablePoints.toLocaleString()}</span>
            </div>

            {selectedPoints > 0 && (
              <div className="flex items-center justify-between p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                <span className="text-green-700 dark:text-green-400 font-medium">Discount:</span>
                <span className="text-green-700 dark:text-green-400 font-bold">
                  -₹{discountValue.toFixed(2)}
                </span>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Max {settings.max_redeem_percentage}% of order total can be paid with points
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LoyaltyRedemption;
