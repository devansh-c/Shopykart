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
      localStorage.removeItem('shopykart_cart');
      localStorage.removeItem('shopykart_wishlist');
    } finally {
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem('shopykart_cart', JSON.stringify(cart));
        localStorage.setItem('shopykart_wishlist', JSON.stringify(wishlist));
      } catch (e: any) {
        if (e.name === 'QuotaExceededError' || e.code === 22) {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('fire_cache_') || key.startsWith('fire_doc_cache_')) {
              localStorage.removeItem(key);
            }
          });
        }
      }
    }
  }, [cart, wishlist, isInitialized]);

  const addToCart = useCallback((product: any) => {
    if (!product || !product.id) return;
    
    setCart((prev) => {
      const productIdStr = String(product.id);
      const existing = prev.find((item) => 
        String(item.id) === productIdStr && 
        item.selectedOption?.name === product.selectedOption?.name
      );
      
      if (existing) {
        return prev.map((item) =>
          (String(item.id) === productIdStr && item.selectedOption?.name === product.selectedOption?.name)
            ? { ...item, quantity: item.quantity + (product.quantity || 1) } 
            : item
        );
      }
      return [...prev, { ...product, id: productIdStr, quantity: product.quantity || 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    const idStr = String(productId);
    setCart((prev) => {
      const index = prev.findIndex(item => String(item.id) === idStr);
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
    const idStr = String(productId);
    setWishlist(prev => 
      prev.includes(idStr) 
        ? prev.filter(id => id !== idStr)
        : [...prev, idStr]
    );
  }, []);

  const isInWishlist = useCallback((productId: string) => wishlist.includes(String(productId)), [wishlist]);

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