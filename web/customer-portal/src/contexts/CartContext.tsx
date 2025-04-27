import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define cart item type
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  image?: string;
  restaurantId: string;
  restaurantName: string;
}

// Define cart context type
interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  restoreCart: (cartItems: CartItem[]) => void;
  itemCount: number;
  total: number;
  isEmpty: boolean;
  restaurantId: string | null;
  restaurantName: string | null;
}

// Create context with default values
const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  restoreCart: () => {},
  itemCount: 0,
  total: 0,
  isEmpty: true,
  restaurantId: null,
  restaurantName: null,
});

// Provider component
interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  // Initialize state from localStorage if available
  const [items, setItems] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);

  // Calculate derived values
  const itemCount = items.reduce((total, item) => total + (item.quantity || 1), 0);
  const total = items.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
  const isEmpty = items.length === 0;

  // Save to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
    
    // Set restaurant info based on first item
    if (items.length > 0) {
      setRestaurantId(items[0].restaurantId);
      setRestaurantName(items[0].restaurantName);
    } else {
      setRestaurantId(null);
      setRestaurantName(null);
    }
  }, [items]);

  // Add item to cart
  const addItem = (newItem: CartItem) => {
    setItems(prevItems => {
      // If cart has items from a different restaurant, prompt user
      if (prevItems.length > 0 && prevItems[0].restaurantId !== newItem.restaurantId) {
        if (window.confirm('Adding items from a different restaurant will clear your current cart. Continue?')) {
          return [{ ...newItem, quantity: 1 }];
        } else {
          return prevItems;
        }
      }
      
      // Check if item already exists
      const existingItemIndex = prevItems.findIndex(item => item.id === newItem.id);
      
      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        const updatedItems = [...prevItems];
        const currentQuantity = updatedItems[existingItemIndex].quantity || 1;
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: currentQuantity + 1
        };
        return updatedItems;
      } else {
        // Add new item with quantity 1
        return [...prevItems, { ...newItem, quantity: 1 }];
      }
    });
  };

  // Remove item from cart
  const removeItem = (itemId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  // Alias for removeItem to match existing code
  const removeFromCart = removeItem;

  // Update item quantity
  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  // Clear entire cart
  const clearCart = () => {
    setItems([]);
    // Also clear from localStorage to ensure consistency
    localStorage.removeItem('cart');
  };
  
  // Restore cart from a previous state (e.g., for recovering after navigation)
  const restoreCart = (cartItems: CartItem[]) => {
    setItems(cartItems);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        removeFromCart,
        updateQuantity,
        clearCart,
        restoreCart,
        itemCount,
        total,
        isEmpty,
        restaurantId,
        restaurantName,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => useContext(CartContext);
