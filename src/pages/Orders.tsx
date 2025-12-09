import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Orders = () => {
  const [activeTab, setActiveTab] = useState('ongoing');

  return (
    <AppLayout>
      <div className="px-4 pt-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">My Orders</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="ongoing" className="animate-fade-in">
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                <ClipboardList className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">No ongoing orders</h2>
              <p className="text-muted-foreground text-center mb-4">
                You don't have any active orders right now.
              </p>
              <Button asChild variant="outline">
                <a href="/">Browse Products</a>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="completed" className="animate-fade-in">
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                <ClipboardList className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">No completed orders</h2>
              <p className="text-muted-foreground text-center mb-4">
                Your completed orders will appear here.
              </p>
              <Button asChild variant="outline">
                <a href="/">Start Shopping</a>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Orders;
