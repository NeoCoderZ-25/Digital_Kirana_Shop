import { Home, Briefcase, MapPin, Phone, Check, Edit2, Trash2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Address {
  id: string;
  label: string;
  address: string;
  phone?: string;
  pincode?: string;
  city?: string;
  state?: string;
  landmark?: string;
  address_type?: string;
  is_default: boolean;
}

interface AddressCardProps {
  address: Address;
  selected: boolean;
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const getAddressIcon = (type?: string) => {
  switch (type) {
    case 'work':
      return Briefcase;
    case 'other':
      return MapPin;
    default:
      return Home;
  }
};

export const AddressCard = ({ address, selected, onSelect, onEdit, onDelete }: AddressCardProps) => {
  const Icon = getAddressIcon(address.address_type);

  const formatFullAddress = () => {
    const parts = [address.address];
    if (address.landmark) parts.push(address.landmark);
    if (address.city) parts.push(address.city);
    if (address.state && address.pincode) parts.push(`${address.state} - ${address.pincode}`);
    else if (address.state) parts.push(address.state);
    else if (address.pincode) parts.push(address.pincode);
    return parts.join(', ');
  };

  return (
    <div
      onClick={onSelect}
      className={cn(
        'relative p-4 rounded-xl border-2 transition-all cursor-pointer group',
        selected
          ? 'border-primary bg-primary/5 shadow-md'
          : 'border-border hover:border-primary/50 bg-card'
      )}
    >
      {/* Selection Indicator */}
      <div className={cn(
        'absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all',
        selected 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-secondary text-muted-foreground'
      )}>
        {selected && <Check className="w-4 h-4" />}
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-2 pr-8">
        <div className={cn(
          'p-2 rounded-lg',
          selected ? 'bg-primary/20' : 'bg-secondary'
        )}>
          <Icon className={cn('w-4 h-4', selected ? 'text-primary' : 'text-muted-foreground')} />
        </div>
        <span className="font-semibold text-foreground">{address.label}</span>
        {address.is_default && (
          <span className="flex items-center gap-1 text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
            <Star className="w-3 h-3 fill-accent" />
            Default
          </span>
        )}
      </div>

      {/* Phone */}
      {address.phone && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Phone className="w-3 h-3" />
          <span>+91 {address.phone}</span>
        </div>
      )}

      {/* Address */}
      <p className="text-sm text-foreground leading-relaxed">
        {formatFullAddress()}
      </p>

      {/* Actions */}
      {(onEdit || onDelete) && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Edit2 className="w-3 h-3" />
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="flex items-center gap-1 text-xs text-destructive hover:underline"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};