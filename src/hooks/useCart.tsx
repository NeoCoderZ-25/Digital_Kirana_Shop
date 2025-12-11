import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  variantName?: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  orderNote: string;
  setOrderNote: (note: string) => void;
  scheduledDelivery: Date | null;
  setScheduledDelivery: (date: Date | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'kirana-cart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [orderNote, setOrderNote] = useState('');
  const [scheduledDelivery, setScheduledDelivery] = useState<Date | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setItems(parsed.items || []);
        setOrderNote(parsed.orderNote || '');
      } catch {
        console.error('Failed to parse cart from localStorage');
      }
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items, orderNote }));
  }, [items, orderNote]);

  const addItem = (newItem: Omit<CartItem, 'quantity'>) => {
    setItems(current => {
      const existingIndex = current.findIndex(
        item => item.productId === newItem.productId && item.variantId === newItem.variantId
      );

      if (existingIndex >= 0) {
        const updated = [...current];
        updated[existingIndex].quantity += 1;
        return updated;
      }

      return [...current, { ...newItem, quantity: 1 }];
    });
  };

  const removeItem = (productId: string, variantId?: string) => {
    setItems(current =>
      current.filter(item => !(item.productId === productId && item.variantId === variantId))
    );
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }

    setItems(current =>
      current.map(item =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setOrderNote('');
    setScheduledDelivery(null);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        orderNote,
        setOrderNote,
        scheduledDelivery,
        setScheduledDelivery,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
