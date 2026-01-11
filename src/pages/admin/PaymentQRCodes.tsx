import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, QrCode, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface PaymentQRCode {
  id: string;
  name: string;
  upi_id: string | null;
  qr_image_url: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

const PaymentQRCodes = () => {
  const [qrCodes, setQrCodes] = useState<PaymentQRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQR, setEditingQR] = useState<PaymentQRCode | null>(null);
  const [formData, setFormData] = useState({ name: '', upi_id: '', qr_image_url: '' });
  const { toast } = useToast();

  useEffect(() => {
    fetchQRCodes();
  }, []);

  const fetchQRCodes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payment_qr_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching QR codes:', error);
      toast({ title: 'Error', description: 'Failed to fetch QR codes', variant: 'destructive' });
    } else {
      setQrCodes(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' });
      return;
    }

    if (editingQR) {
      const { error } = await supabase
        .from('payment_qr_codes')
        .update({
          name: formData.name,
          upi_id: formData.upi_id || null,
          qr_image_url: formData.qr_image_url || null
        })
        .eq('id', editingQR.id);

      if (error) {
        toast({ title: 'Error', description: 'Failed to update QR code', variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'QR code updated successfully' });
        fetchQRCodes();
      }
    } else {
      const { error } = await supabase
        .from('payment_qr_codes')
        .insert({
          name: formData.name,
          upi_id: formData.upi_id || null,
          qr_image_url: formData.qr_image_url || null,
          is_active: true
        });

      if (error) {
        toast({ title: 'Error', description: 'Failed to create QR code', variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'QR code created successfully' });
        fetchQRCodes();
      }
    }

    setDialogOpen(false);
    setEditingQR(null);
    setFormData({ name: '', upi_id: '', qr_image_url: '' });
  };

  const handleEdit = (qr: PaymentQRCode) => {
    setEditingQR(qr);
    setFormData({
      name: qr.name,
      upi_id: qr.upi_id || '',
      qr_image_url: qr.qr_image_url || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('payment_qr_codes')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete QR code', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'QR code deleted successfully' });
      fetchQRCodes();
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean | null) => {
    const { error } = await supabase
      .from('payment_qr_codes')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } else {
      fetchQRCodes();
    }
  };

  const openNewDialog = () => {
    setEditingQR(null);
    setFormData({ name: '', upi_id: '', qr_image_url: '' });
    setDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payment QR Codes</h1>
            <p className="text-muted-foreground">Manage UPI payment QR codes for checkout</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add QR Code
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingQR ? 'Edit QR Code' : 'Add QR Code'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., PhonePe, GPay, Paytm"
                  />
                </div>
                <div>
                  <Label htmlFor="upi_id">UPI ID</Label>
                  <Input
                    id="upi_id"
                    value={formData.upi_id}
                    onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                    placeholder="yourname@upi"
                  />
                </div>
                <div>
                  <Label htmlFor="qr_image_url">QR Image URL</Label>
                  <Input
                    id="qr_image_url"
                    value={formData.qr_image_url}
                    onChange={(e) => setFormData({ ...formData, qr_image_url: e.target.value })}
                    placeholder="https://..."
                  />
                  {formData.qr_image_url && (
                    <div className="mt-2 p-2 bg-muted rounded-lg">
                      <img
                        src={formData.qr_image_url}
                        alt="QR Preview"
                        className="max-w-[200px] mx-auto"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
                <Button onClick={handleSubmit} className="w-full">
                  {editingQR ? 'Update QR Code' : 'Create QR Code'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-48" />
              </Card>
            ))}
          </div>
        ) : qrCodes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <QrCode className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg">No QR codes yet</h3>
              <p className="text-muted-foreground mb-4">Add your first UPI QR code for payments</p>
              <Button onClick={openNewDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add QR Code
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {qrCodes.map(qr => (
              <Card 
                key={qr.id} 
                className={cn(
                  "hover:shadow-lg transition-shadow",
                  qr.is_active && "ring-2 ring-primary"
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{qr.name}</CardTitle>
                      {qr.is_active && (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={qr.is_active || false}
                        onCheckedChange={() => toggleActive(qr.id, qr.is_active)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {qr.upi_id && (
                    <p className="text-sm text-muted-foreground mb-2">
                      UPI: {qr.upi_id}
                    </p>
                  )}
                  {qr.qr_image_url && (
                    <div className="bg-muted rounded-lg p-2 mb-3">
                      <img
                        src={qr.qr_image_url}
                        alt={qr.name}
                        className="max-h-32 mx-auto"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(qr)}>
                      <Pencil className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete QR Code</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{qr.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(qr.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PaymentQRCodes;
