import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useDeliveryBoy } from '@/hooks/useDeliveryBoy';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, MapPin, Heart, Lock, LogOut, Trash2, ChevronRight, Plus, Edit2, Settings, Truck, Bell, Moon, Sun, Globe, Shield, Phone, Mail, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ProductCard } from '@/components/ProductCard';
import { useFavorites } from '@/hooks/useFavorites';
import { Product } from '@/hooks/useProducts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoyaltyCard from '@/components/LoyaltyCard';
import { useLanguage } from '@/contexts/LanguageContext';

interface Address {
  id: string;
  label: string;
  address: string;
  is_default: boolean;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { isDeliveryBoy, loading: deliveryLoading } = useDeliveryBoy();
  const { toast } = useToast();
  const { favorites } = useFavorites();
  const { language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState('profile');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [newAddress, setNewAddress] = useState({ label: 'Home', address: '' });
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    username: '',
    phone: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';
  const email = user?.email || '';
  const phone = user?.user_metadata?.phone || 'Not provided';

  useEffect(() => {
    if (user) {
      fetchAddresses();
      setProfileData({
        username: user?.user_metadata?.username || user?.email?.split('@')[0] || '',
        phone: user?.user_metadata?.phone || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (favorites.length > 0) {
      fetchFavoriteProducts();
    } else {
      setFavoriteProducts([]);
    }
  }, [favorites]);

  const fetchAddresses = async () => {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user?.id)
      .order('is_default', { ascending: false });

    if (!error) {
      setAddresses(data || []);
    }
  };

  const fetchFavoriteProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name),
        variants:product_variants(id, name, extra_price, in_stock)
      `)
      .in('id', favorites);

    if (!error) {
      setFavoriteProducts(data || []);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.address.trim()) {
      toast({ title: 'Error', description: 'Please enter an address', variant: 'destructive' });
      return;
    }

    const { data, error } = await supabase
      .from('addresses')
      .insert({
        user_id: user?.id,
        label: newAddress.label,
        address: newAddress.address,
        is_default: addresses.length === 0,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: 'Failed to add address', variant: 'destructive' });
    } else {
      setAddresses([...addresses, data]);
      setShowAddAddress(false);
      setNewAddress({ label: 'Home', address: '' });
      toast({ title: 'Success', description: 'Address added successfully' });
    }
  };

  const handleUpdateAddress = async () => {
    if (!editingAddress) return;

    const { error } = await supabase
      .from('addresses')
      .update({ label: editingAddress.label, address: editingAddress.address })
      .eq('id', editingAddress.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update address', variant: 'destructive' });
    } else {
      setAddresses(addresses.map(a => a.id === editingAddress.id ? editingAddress : a));
      setEditingAddress(null);
      toast({ title: 'Success', description: 'Address updated successfully' });
    }
  };

  const handleDeleteAddress = async (id: string) => {
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete address', variant: 'destructive' });
    } else {
      setAddresses(addresses.filter(a => a.id !== id));
      toast({ title: 'Success', description: 'Address deleted successfully' });
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast({ title: 'Logged out', description: 'You have been successfully logged out.' });
  };

  const handleDarkModeToggle = (enabled: boolean) => {
    setDarkMode(enabled);
    if (enabled) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          username: profileData.username,
          phone: profileData.phone,
        }
      });

      if (error) throw error;

      // Also update profiles table
      await supabase
        .from('profiles')
        .update({
          username: profileData.username,
          phone: profileData.phone,
        })
        .eq('user_id', user.id);

      toast({ title: 'Success', description: 'Profile updated successfully' });
      setEditingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-24">
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
                <p className="text-muted-foreground text-sm flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {email}
                </p>
                <p className="text-muted-foreground text-sm flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {phone}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingProfile(true)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile Dialog */}
        <Dialog open={editingProfile} onOpenChange={setEditingProfile}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Username</Label>
                <Input
                  value={profileData.username}
                  onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                  placeholder="Enter username"
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <Button onClick={handleSaveProfile} disabled={savingProfile} className="w-full">
                {savingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Admin Dashboard Card - Only visible to admins */}
        {!adminLoading && isAdmin && (
          <Card className="mb-4 animate-fade-in border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <Link to="/admin" className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <Settings className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Admin Dashboard</h3>
                    <p className="text-sm text-muted-foreground">Manage products, orders & more</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Delivery Boy Dashboard Card - Only visible to delivery boys */}
        {!deliveryLoading && isDeliveryBoy && (
          <Card className="mb-4 animate-fade-in border-accent/20 bg-accent/5">
            <CardContent className="pt-6">
              <Link to="/delivery" className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                    <Truck className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Delivery Dashboard</h3>
                    <p className="text-sm text-muted-foreground">View and manage your deliveries</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Loyalty Card */}
        <div className="mb-6">
          <LoyaltyCard />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-3">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Username</span>
                  </div>
                  <span className="font-medium">{username}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Email</span>
                  </div>
                  <span className="font-medium text-sm">{email}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Phone</span>
                  </div>
                  <span className="font-medium">{phone}</span>
                </div>
              </CardContent>
            </Card>

            <Dialog>
              <DialogTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 bg-card rounded-lg border border-border hover:bg-accent/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium text-foreground">Change Password</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Password reset functionality will be available soon.
                  </p>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="w-full justify-start gap-3" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
              Logout
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-5 h-5" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove all your data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          <TabsContent value="settings" className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  App Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Dark Mode */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    {darkMode ? <Moon className="w-5 h-5 text-muted-foreground" /> : <Sun className="w-5 h-5 text-muted-foreground" />}
                    <div>
                      <p className="font-medium">Dark Mode</p>
                      <p className="text-xs text-muted-foreground">Toggle dark/light theme</p>
                    </div>
                  </div>
                  <Switch checked={darkMode} onCheckedChange={handleDarkModeToggle} />
                </div>

                {/* Notifications */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Notifications</p>
                      <p className="text-xs text-muted-foreground">Receive order updates</p>
                    </div>
                  </div>
                  <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                </div>

                {/* Language */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Language</p>
                      <p className="text-xs text-muted-foreground">Select your preferred language</p>
                    </div>
                  </div>
                  <Select value={language} onValueChange={(val: 'en' | 'hi') => setLanguage(val)}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">हिंदी</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Privacy & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/10 transition-colors">
                  <span className="text-sm">Privacy Policy</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/10 transition-colors">
                  <span className="text-sm">Terms of Service</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/10 transition-colors">
                  <span className="text-sm">Data & Permissions</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addresses" className="space-y-3">
            {addresses.map((addr) => (
              <Card key={addr.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="font-medium">{addr.label}</span>
                        {addr.is_default && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Default</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{addr.address}</p>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingAddress(addr)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Address</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Label</Label>
                              <Input
                                value={editingAddress?.label || ''}
                                onChange={(e) => setEditingAddress(prev => prev ? { ...prev, label: e.target.value } : null)}
                              />
                            </div>
                            <div>
                              <Label>Address</Label>
                              <Input
                                value={editingAddress?.address || ''}
                                onChange={(e) => setEditingAddress(prev => prev ? { ...prev, address: e.target.value } : null)}
                              />
                            </div>
                            <Button onClick={handleUpdateAddress} className="w-full">Save</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Address?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteAddress(addr.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {showAddAddress ? (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <Label>Label</Label>
                    <Input
                      value={newAddress.label}
                      onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                      placeholder="Home, Work, etc."
                    />
                  </div>
                  <div>
                    <Label>Full Address</Label>
                    <Input
                      value={newAddress.address}
                      onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                      placeholder="Enter your full address"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddAddress} className="flex-1">Save</Button>
                    <Button variant="outline" onClick={() => setShowAddAddress(false)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => setShowAddAddress(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add New Address
              </Button>
            )}
          </TabsContent>

          <TabsContent value="favorites">
            {favoriteProducts.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No favorites yet</p>
                <p className="text-sm text-muted-foreground">Tap the heart icon on products to add them here</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {favoriteProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Profile;
