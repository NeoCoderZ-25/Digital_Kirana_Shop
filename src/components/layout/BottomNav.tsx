import { Home, ShoppingCart, ClipboardList, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: ShoppingCart, label: 'Cart', path: '/cart', showBadge: true },
  { icon: ClipboardList, label: 'Orders', path: '/orders' },
  { icon: User, label: 'Profile', path: '/profile' },
];

const BottomNav = () => {
  const location = useLocation();
  const { items } = useCart();
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-50 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map(({ icon: Icon, label, path, showBadge }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 group',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <span className="absolute -top-0.5 w-12 h-1 bg-primary rounded-full" />
              )}
              
              <div className="relative">
                <Icon
                  className={cn(
                    'w-5 h-5 transition-all duration-200',
                    isActive ? 'scale-110' : 'group-hover:scale-105'
                  )}
                />
                {/* Cart badge */}
                {showBadge && cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full px-1">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </div>
              
              <span className={cn(
                'text-[10px] mt-1 font-medium transition-all',
                isActive && 'font-semibold'
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
