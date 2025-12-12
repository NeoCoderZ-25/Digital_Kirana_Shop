import { ReactNode, useEffect } from 'react';
import BottomNav from './BottomNav';
import { useNotifications } from '@/hooks/useNotifications';

interface AppLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

const AppLayout = ({ children, hideNav = false }: AppLayoutProps) => {
  const { requestPermission, permission, isSupported } = useNotifications();

  // Request notification permission on first load
  useEffect(() => {
    if (isSupported && permission === 'default') {
      // Delay the request to not be intrusive on first load
      const timer = setTimeout(() => {
        requestPermission();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isSupported, permission, requestPermission]);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background">
      {/* Main content with safe bottom padding */}
      <main className={hideNav ? '' : 'pb-20 pb-[calc(5rem+env(safe-area-inset-bottom,0px))]'}>
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
};

export default AppLayout;
