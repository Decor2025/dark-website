import React, { createContext, useContext, useEffect, useState } from 'react';
import { ref, push, set, remove, onValue, get } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from './AuthContext';
import { CartItem, Product } from '../types';
import toast from 'react-hot-toast';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotalPrice: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setCartItems([]);
      return;
    }

    const cartRef = ref(database, `carts/${currentUser.uid}`);
    const unsubscribe = onValue(cartRef, async (snapshot) => {
      if (snapshot.exists()) {
        const cartData = snapshot.val();
        const items: CartItem[] = [];
        
        for (const itemId in cartData) {
          const item = cartData[itemId];
          const productRef = ref(database, `products/${item.productId}`);
          const productSnapshot = await get(productRef);
          
          if (productSnapshot.exists()) {
            items.push({
              id: itemId,
              ...item,
              product: productSnapshot.val(),
            });
          }
        }
        
        setCartItems(items);
      } else {
        setCartItems([]);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  const addToCart = async (product: Product, quantity = 1) => {
    if (!currentUser) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      const cartRef = ref(database, `carts/${currentUser.uid}`);
      const existingItem = cartItems.find(item => item.productId === product.id);

      if (existingItem) {
        await updateQuantity(existingItem.id, existingItem.quantity + quantity);
      } else {
        const newItemRef = push(cartRef);
        await set(newItemRef, {
          productId: product.id,
          quantity,
          userId: currentUser.uid,
          addedAt: new Date().toISOString(),
        });
      }
      
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
      console.error('Error adding to cart:', error);
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (!currentUser) return;

    try {
      const itemRef = ref(database, `carts/${currentUser.uid}/${itemId}`);
      await remove(itemRef);
      toast.success('Removed from cart');
    } catch (error) {
      toast.error('Failed to remove from cart');
      console.error('Error removing from cart:', error);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!currentUser) return;

    try {
      const itemRef = ref(database, `carts/${currentUser.uid}/${itemId}`);
      if (quantity <= 0) {
        await remove(itemRef);
      } else {
        await set(itemRef, {
          ...cartItems.find(item => item.id === itemId),
          quantity,
        });
      }
    } catch (error) {
      toast.error('Failed to update quantity');
      console.error('Error updating quantity:', error);
    }
  };

  const clearCart = async () => {
    if (!currentUser) return;

    try {
      const cartRef = ref(database, `carts/${currentUser.uid}`);
      await remove(cartRef);
      toast.success('Cart cleared');
    } catch (error) {
      toast.error('Failed to clear cart');
      console.error('Error clearing cart:', error);
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getItemCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};