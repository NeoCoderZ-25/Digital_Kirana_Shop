import { ReactNode } from 'react';
import BottomNav from './BottomNav';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background pb-20">
      {children}
      <BottomNav />
    </div>
  );
};

export default AppLayout;
