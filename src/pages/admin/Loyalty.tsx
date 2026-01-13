import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Award, Users, TrendingUp, Settings, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LoyaltySettings {
  id: string;
  points_per_rupee: number;
  point_value: number;
  min_redeem_points: number;
  max_redeem_percentage: number;
  signup_bonus: number;
  referral_bonus: number;
  is_active: boolean;
}

const AdminLoyalty = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ totalUsers: 0, totalPoints: 0, totalRedeemed: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: settingsData } = await supabase.from('loyalty_settings').select('*').limit(1).maybeSingle();
      if (settingsData) setSettings(settingsData);

      const { data: pointsData } = await supabase.from('loyalty_points').select('total_points, lifetime_spent');
      if (pointsData) {
        setStats({
          totalUsers: pointsData.length,
          totalPoints: pointsData.reduce((sum, p) => sum + (p.total_points || 0), 0),
          totalRedeemed: pointsData.reduce((sum, p) => sum + (p.lifetime_spent || 0), 0),
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('loyalty_settings').update(settings).eq('id', settings.id);
      if (error) throw error;
      toast({ title: 'Settings saved' });
    } catch (error) {
      toast({ title: 'Error saving settings', variant: 'destructive' });
    } finally {
      setSaving(false);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Loyalty Program</h1>
            <p className="text-muted-foreground">Manage points and rewards</p>
          </div>
          {settings && (
            <div className="flex items-center gap-2">
              <span className="text-sm">Program Active</span>
              <Switch checked={settings.is_active} onCheckedChange={(checked) => setSettings({ ...settings, is_active: checked })} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="p-4 flex items-center gap-3"><Users className="w-8 h-8 text-primary" /><div><p className="text-sm text-muted-foreground">Members</p><p className="text-2xl font-bold">{stats.totalUsers}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><Award className="w-8 h-8 text-accent" /><div><p className="text-sm text-muted-foreground">Active Points</p><p className="text-2xl font-bold">{stats.totalPoints.toLocaleString()}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><TrendingUp className="w-8 h-8 text-success" /><div><p className="text-sm text-muted-foreground">Redeemed</p><p className="text-2xl font-bold">{stats.totalRedeemed.toLocaleString()}</p></div></CardContent></Card>
        </div>

        {settings && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" />Program Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Points per ₹ spent</Label><Input type="number" value={settings.points_per_rupee} onChange={(e) => setSettings({ ...settings, points_per_rupee: parseFloat(e.target.value) || 0 })} /></div>
                <div><Label>Point Value (₹)</Label><Input type="number" step="0.01" value={settings.point_value} onChange={(e) => setSettings({ ...settings, point_value: parseFloat(e.target.value) || 0 })} /></div>
                <div><Label>Min Redeem Points</Label><Input type="number" value={settings.min_redeem_points} onChange={(e) => setSettings({ ...settings, min_redeem_points: parseInt(e.target.value) || 0 })} /></div>
                <div><Label>Max Redeem %</Label><Input type="number" value={settings.max_redeem_percentage} onChange={(e) => setSettings({ ...settings, max_redeem_percentage: parseFloat(e.target.value) || 0 })} /></div>
                <div><Label>Signup Bonus</Label><Input type="number" value={settings.signup_bonus} onChange={(e) => setSettings({ ...settings, signup_bonus: parseInt(e.target.value) || 0 })} /></div>
                <div><Label>Referral Bonus</Label><Input type="number" value={settings.referral_bonus} onChange={(e) => setSettings({ ...settings, referral_bonus: parseInt(e.target.value) || 0 })} /></div>
              </div>
              <Button onClick={handleSave} disabled={saving}>{saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Settings'}</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminLoyalty;
