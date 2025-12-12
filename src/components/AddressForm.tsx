import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Home, Briefcase, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AddressFormData {
  label: string;
  address: string;
  phone: string;
  pincode: string;
  city: string;
  state: string;
  landmark: string;
  address_type: 'home' | 'work' | 'other';
}

interface AddressFormProps {
  onSubmit: (data: AddressFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const addressTypes = [
  { value: 'home', label: 'Home', icon: Home },
  { value: 'work', label: 'Work', icon: Briefcase },
  { value: 'other', label: 'Other', icon: MapPin },
];

export const AddressForm = ({ onSubmit, onCancel, loading }: AddressFormProps) => {
  const [formData, setFormData] = useState<AddressFormData>({
    label: 'Home',
    address: '',
    phone: '',
    pincode: '',
    city: '',
    state: '',
    landmark: '',
    address_type: 'home'
  });
  const [errors, setErrors] = useState<Partial<Record<keyof AddressFormData, string>>>({});

  const validate = () => {
    const newErrors: Partial<Record<keyof AddressFormData, string>> = {};
    
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Enter valid 10-digit number';
    if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(formData.pincode)) newErrors.pincode = 'Enter valid 6-digit pincode';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validate()) {
      await onSubmit(formData);
    }
  };

  const handlePincodeChange = async (pincode: string) => {
    setFormData({ ...formData, pincode });
    
    // Auto-fetch city/state from pincode (simple India pincode API)
    if (pincode.length === 6 && /^\d{6}$/.test(pincode)) {
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await response.json();
        if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
          const postOffice = data[0].PostOffice[0];
          setFormData(prev => ({
            ...prev,
            city: postOffice.District || prev.city,
            state: postOffice.State || prev.state
          }));
        }
      } catch (error) {
        console.log('Failed to fetch pincode data');
      }
    }
  };

  return (
    <div className="space-y-4 p-4 border border-dashed border-primary/50 rounded-xl bg-primary/5 animate-fade-in">
      {/* Address Type */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Address Type</Label>
        <div className="flex gap-2">
          {addressTypes.map(type => (
            <button
              key={type.value}
              onClick={() => setFormData({ 
                ...formData, 
                address_type: type.value as AddressFormData['address_type'],
                label: type.label 
              })}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all',
                formData.address_type === type.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              )}
            >
              <type.icon className="w-4 h-4" />
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Phone */}
      <div>
        <Label className="text-sm font-medium">Phone Number *</Label>
        <Input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
          placeholder="10-digit mobile number"
          className={cn(errors.phone && 'border-destructive')}
        />
        {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
      </div>

      {/* Pincode, City, State */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-sm font-medium">Pincode *</Label>
          <Input
            value={formData.pincode}
            onChange={(e) => handlePincodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit"
            className={cn(errors.pincode && 'border-destructive')}
          />
          {errors.pincode && <p className="text-xs text-destructive mt-1">{errors.pincode}</p>}
        </div>
        <div>
          <Label className="text-sm font-medium">City *</Label>
          <Input
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="City"
            className={cn(errors.city && 'border-destructive')}
          />
        </div>
        <div>
          <Label className="text-sm font-medium">State *</Label>
          <Input
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            placeholder="State"
            className={cn(errors.state && 'border-destructive')}
          />
        </div>
      </div>

      {/* Full Address */}
      <div>
        <Label className="text-sm font-medium">House/Flat/Building, Street *</Label>
        <Input
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Enter your full address"
          className={cn(errors.address && 'border-destructive')}
        />
        {errors.address && <p className="text-xs text-destructive mt-1">{errors.address}</p>}
      </div>

      {/* Landmark */}
      <div>
        <Label className="text-sm font-medium">Landmark (Optional)</Label>
        <Input
          value={formData.landmark}
          onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
          placeholder="Near temple, school, etc."
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button onClick={handleSubmit} disabled={loading} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Address'
          )}
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
};