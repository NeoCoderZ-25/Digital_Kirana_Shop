import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, MapPin, Heart, Lock, LogOut, Trash2, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';
  const email = user?.email || '';
  const phone = user?.user_metadata?.phone || 'Not provided';

  const handleLogout = async () => {
    await signOut();
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
  };

  const menuItems = [
    { icon: MapPin, label: 'Saved Addresses', onClick: () => {} },
    { icon: Heart, label: 'Favorites', onClick: () => {} },
    { icon: Lock, label: 'Change Password', onClick: () => {} },
  ];

  return (
    <AppLayout>
      <div className="px-4 pt-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">Profile</h1>

        {/* User Info Card */}
        <Card className="mb-6 animate-fade-in">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-foreground">{username}</h2>
                <p className="text-muted-foreground text-sm">{email}</p>
                <p className="text-muted-foreground text-sm">{phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <div className="space-y-2 mb-6">
          {menuItems.map(({ icon: Icon, label, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="w-full flex items-center justify-between p-4 bg-card rounded-lg border border-border hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-foreground">{label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Logout
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-5 h-5" />
            Delete Account
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
