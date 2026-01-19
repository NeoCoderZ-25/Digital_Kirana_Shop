import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useAdmin } from "@/hooks/useAdmin";
import { useDeliveryBoy } from "@/hooks/useDeliveryBoy";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import ProductDetail from "./pages/ProductDetail";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrderTracking from "./pages/OrderTracking";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminOrders from "./pages/admin/Orders";
import AdminOrderDetail from "./pages/admin/OrderDetail";
import AdminProducts from "./pages/admin/Products";
import AdminProductForm from "./pages/admin/ProductForm";
import AdminCategories from "./pages/admin/Categories";
import AdminPaymentQRCodes from "./pages/admin/PaymentQRCodes";
import AdminCustomers from "./pages/admin/Customers";
import AdminReviews from "./pages/admin/Reviews";
import AdminCoupons from "./pages/admin/Coupons";
import AdminCouponForm from "./pages/admin/CouponForm";
import AdminLoyalty from "./pages/admin/Loyalty";
import AdminWallets from "./pages/admin/Wallets";
import AdminPoints from "./pages/admin/Points";

// Delivery Pages
import DeliveryDashboard from "./pages/delivery/Dashboard";
import DeliveryOrderDetail from "./pages/delivery/OrderDetail";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  
  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const DeliveryRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { isDeliveryBoy, loading: deliveryLoading } = useDeliveryBoy();
  
  if (authLoading || deliveryLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (!isDeliveryBoy) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
    <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
    <Route path="/product/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
    <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
    <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
    <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
    <Route path="/order/:id" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
    <Route path="/order-confirmation" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    
    {/* Delivery Routes */}
    <Route path="/delivery" element={<DeliveryRoute><DeliveryDashboard /></DeliveryRoute>} />
    <Route path="/delivery/order/:id" element={<DeliveryRoute><DeliveryOrderDetail /></DeliveryRoute>} />
    
    {/* Admin Routes */}
    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
    <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
    <Route path="/admin/orders/:id" element={<AdminRoute><AdminOrderDetail /></AdminRoute>} />
    <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
    <Route path="/admin/products/new" element={<AdminRoute><AdminProductForm /></AdminRoute>} />
    <Route path="/admin/products/:id/edit" element={<AdminRoute><AdminProductForm /></AdminRoute>} />
    <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
    <Route path="/admin/payment-qr" element={<AdminRoute><AdminPaymentQRCodes /></AdminRoute>} />
    <Route path="/admin/customers" element={<AdminRoute><AdminCustomers /></AdminRoute>} />
    <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />
    <Route path="/admin/coupons" element={<AdminRoute><AdminCoupons /></AdminRoute>} />
    <Route path="/admin/coupons/new" element={<AdminRoute><AdminCouponForm /></AdminRoute>} />
    <Route path="/admin/coupons/:id/edit" element={<AdminRoute><AdminCouponForm /></AdminRoute>} />
    <Route path="/admin/loyalty" element={<AdminRoute><AdminLoyalty /></AdminRoute>} />
    <Route path="/admin/wallets" element={<AdminRoute><AdminWallets /></AdminRoute>} />
    <Route path="/admin/points" element={<AdminRoute><AdminPoints /></AdminRoute>} />
    
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <AppRoutes />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
