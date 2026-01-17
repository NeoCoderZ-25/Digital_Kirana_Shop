import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Home, Briefcase, MapPin, Loader2, CheckCircle, AlertCircle, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import { geocodeAddress, reverseGeocode, GeocodingResult } from '@/services/geocoding';
import AddressMap from '@/components/AddressMap';

export interface AddressFormData {
  label: string;
  address: string;
  phone: string;
  pincode: string;
  city: string;
  state: string;
  landmark: string;
  address_type: 'home' | 'work' | 'other';
  latitude?: number;
  longitude?: number;
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
  const [geocoding, setGeocoding] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [geocodeResult, setGeocodeResult] = useState<GeocodingResult | null>(null);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

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
      await onSubmit({
        ...formData,
        latitude: geocodeResult?.latitude,
        longitude: geocodeResult?.longitude,
      });
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

  const handleVerifyLocation = async () => {
    if (!formData.address || !formData.city || !formData.state) {
      setGeocodeError('Please fill in address, city, and state first');
      return;
    }

    setGeocoding(true);
    setGeocodeError(null);

    const fullAddress = `${formData.address}, ${formData.landmark ? formData.landmark + ', ' : ''}${formData.city}, ${formData.state}, ${formData.pincode}, India`;
    
    const result = await geocodeAddress(fullAddress);
    
    if (result) {
      setGeocodeResult(result);
      setGeocodeError(null);
    } else {
      setGeocodeError('Could not find location. You can still save without coordinates.');
      setGeocodeResult(null);
    }
    
    setGeocoding(false);
  };

  const handleMapPositionChange = (lat: number, lon: number) => {
    setGeocodeResult(prev => prev ? { ...prev, latitude: lat, longitude: lon } : null);
  };

  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setGeocodeError('Geolocation is not supported by your browser');
      return;
    }

    setFetchingLocation(true);
    setGeocodeError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocode to get address
        const result = await reverseGeocode(latitude, longitude);
        
        if (result && result.success) {
          setGeocodeResult({
            success: true,
            latitude,
            longitude,
            displayName: result.address || 'Current Location'
          });
          
          // Auto-fill form fields if available
          setFormData(prev => ({
            ...prev,
            address: result.address || prev.address,
            city: result.city || prev.city,
            state: result.state || prev.state,
            pincode: result.pincode || prev.pincode,
          }));
        } else {
          // Still set the coordinates even if reverse geocode fails
          setGeocodeResult({
            success: true,
            latitude,
            longitude,
            displayName: 'Current Location'
          });
        }
        
        setFetchingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setGeocodeError(errorMessage);
        setFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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

      {/* Location Verification */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleGetCurrentLocation}
            disabled={fetchingLocation}
            className="flex items-center gap-2"
          >
            {fetchingLocation ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" />
                Use Current Location
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleVerifyLocation}
            disabled={geocoding}
            className="flex items-center gap-2"
          >
            {geocoding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                Verify Address
              </>
            )}
          </Button>
          {geocodeResult && (
            <span className="text-sm text-success flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Location set
            </span>
          )}
        </div>

        {geocodeError && (
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
            <AlertCircle className="w-4 h-4" />
            {geocodeError}
          </div>
        )}

        {geocodeResult && geocodeResult.success && (
          <div className="rounded-xl overflow-hidden border border-border">
            <AddressMap
              latitude={geocodeResult.latitude}
              longitude={geocodeResult.longitude}
              onLocationChange={handleMapPositionChange}
              draggable={true}
            />
            <p className="text-xs text-muted-foreground p-2 bg-muted/50">
              📍 Drag the pin to adjust location if needed
            </p>
          </div>
        )}
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
