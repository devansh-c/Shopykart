'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback, useEffect } from 'react';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  isCustom?: boolean;
  vendorId?: string;
  selectedOption?: { name: string; price: number } | null;
  instructions?: string;
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
  const [isInitialized, setIsInitialized] = useState(false);

  // 1. Defensively load cart from localStorage to prevent "Unexpected end of JSON input"
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('shopykart_cart');
      if (savedCart && savedCart.trim() !== '') {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) setCart(parsed);
      }
      
      const savedWishlist = localStorage.getItem('shopykart_wishlist');
      if (savedWishlist && savedWishlist.trim() !== '') {
        const parsed = JSON.parse(savedWishlist);
        if (Array.isArray(parsed)) setWishlist(parsed);
      }
    } catch (e) {
      console.warn("Cart restoration failed: Malformed data in localStorage.");
      localStorage.removeItem('shopykart_cart');
      localStorage.removeItem('shopykart_wishlist');
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // 2. Persist cart to localStorage
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('shopykart_cart', JSON.stringify(cart));
      localStorage.setItem('shopykart_wishlist', JSON.stringify(wishlist));
    }
  }, [cart, wishlist, isInitialized]);

  const addToCart = useCallback((product: any) => {
    setCart((prev) => {
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
    localStorage.removeItem('shopykart_cart');
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
