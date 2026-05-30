
'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  isCustom?: boolean;
  vendorId?: string;
  selectedOption?: { name: string; price: number } | null;
  restaurantName?: string;
  customSurcharge?: number;
};

type CartContextType = {
  cart: CartItem[];
  wishlist: string[];
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);

  const addToCart = useCallback((product: any) => {
    setCart((prev) => {
      // Logic: If product has different options, treat as different cart items
      const existing = prev.find((item) => 
        item.id === product.id && 
        item.selectedOption?.name === product.selectedOption?.name
      );
      
      if (existing) {
        return prev.map((item) =>
          (item.id === product.id && item.selectedOption?.name === product.selectedOption?.name)
            ? { ...item, quantity: item.quantity + (product.quantity || 1) } 
            : item
        );
      }
      return [...prev, { ...product, quantity: product.quantity || 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => {
      // Find the first instance of this product ID to remove
      const index = prev.findIndex(item => item.id === productId);
      if (index === -1) return prev;
      
      const item = prev[index];
      if (item.quantity > 1) {
        const newCart = [...prev];
        newCart[index] = { ...item, quantity: item.quantity - 1 };
        return newCart;
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const toggleWishlist = useCallback((productId: string) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  }, []);

  const isInWishlist = useCallback((productId: string) => wishlist.includes(productId), [wishlist]);

  const totalItems = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  
  const totalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const value = useMemo(() => ({
    cart, 
    wishlist,
    addToCart, 
    removeFromCart, 
    clearCart, 
    toggleWishlist, 
    isInWishlist,
    totalItems, 
    totalPrice 
  }), [cart, wishlist, addToCart, removeFromCart, clearCart, toggleWishlist, isInWishlist, totalItems, totalPrice]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
