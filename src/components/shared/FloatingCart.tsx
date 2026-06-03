"use client"

import { useCart } from '@/components/cart/CartProvider';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';

/**
 * @fileOverview FloatingCart component optimized for Premium Smoothness and Zero Latency.
 */
export function FloatingCart() {
  const { totalItems, totalPrice } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const prevItemsRef = useRef(totalItems);

  // Prefetch cart page immediately for instant jump
  useEffect(() => {
    router.prefetch('/cart');
  }, [router]);

  useEffect(() => {
    if (totalItems > prevItemsRef.current) {
      setIsVisible(true);
    }
    prevItemsRef.current = totalItems;
    if (totalItems === 0) setIsVisible(false);
  }, [totalItems]);

  const isHiddenPage = ['/cart', '/admin', '/login', '/vendor', '/delivery'].some(path => pathname?.startsWith(path));
  
  if (isHiddenPage || totalItems === 0 || !isVisible) return null;

  const handleNavigate = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push('/cart');
  };

  return (
    <div className="fixed bottom-22 left-4 right-4 z-40 animate-in slide-in-from-bottom-8 fade-in duration-500">
      <button 
        onPointerDown={handleNavigate}
        className="w-full h-15 bg-[#0B0B0B] text-white rounded-[1.5rem] flex items-center justify-between px-5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 active:scale-[0.96] transition-all duration-300 group touch-manipulation pointer-events-auto overflow-hidden"
      >
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-active:translate-x-full transition-transform duration-1000" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="bg-primary h-10 w-10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 transition-transform duration-500 group-hover:rotate-12">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-primary">Item Added</span>
              <span className="h-1 w-1 bg-white/20 rounded-full" />
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">{totalItems} Total</span>
            </div>
            <span className="text-base font-black italic tracking-tight">₹{totalPrice.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 relative z-10">
          <span className="text-[10px] font-black uppercase tracking-widest italic text-white/80">View Cart</span>
          <div className="bg-white/10 p-1.5 rounded-full group-active:translate-x-1 transition-transform">
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </button>
    </div>
  );
}
