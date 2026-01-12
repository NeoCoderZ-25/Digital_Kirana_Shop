import { ShoppingCart, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/hooks/useAdmin';

export const Header = () => {
  const { totalItems } = useCart();
  const { isAdmin, loading: adminLoading } = useAdmin();

  return (
    <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
      <div className="container flex items-center justify-between h-14 px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-display font-bold">KiranaStore</span>
        </Link>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Admin Button - Only visible to admins */}
          {!adminLoading && isAdmin && (
            <Link to="/admin">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Settings className="w-4 h-4 mr-1" />
                Admin
              </Button>
            </Link>
          )}

          {/* Cart Icon */}
          <Link to="/cart" className="relative p-2">
            <ShoppingCart className="w-6 h-6" />
            {totalItems > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-accent text-accent-foreground">
                {totalItems > 99 ? '99+' : totalItems}
              </Badge>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};