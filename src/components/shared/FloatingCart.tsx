
"use client"

import { useCart } from '@/components/cart/CartProvider';
import { ShoppingCart, ArrowRight, Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

/**
 * @fileOverview Compact Luxury Golden Floating Cart.
 * Features: 5s Auto-dismiss, Shine Animation, Small & Sleek Styling.
 */
export function FloatingCart() {
  const { totalItems, totalPrice } = useCart();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const prevItemsRef = useRef(totalItems);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Show whenever items are added or changed
    if (totalItems > 0) {
      setIsVisible(true);
      
      // Clear existing timer if any
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }

      // Auto-hide after 5 seconds
      dismissTimerRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    } else {
      setIsVisible(false);
    }

    prevItemsRef.current = totalItems;

    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [totalItems]);

  const isHiddenPage = ['/cart', '/admin', '/login', '/vendor', '/delivery', '/Medical', '/Beauty'].some(path => pathname?.startsWith(path));
  
  if (isHiddenPage || totalItems === 0) return null;

  return (
    <div className={cn(
      "fixed bottom-[74px] left-4 right-4 z-[9998] transition-all duration-700 ease-premium transform-gpu pointer-events-none",
      isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-90 pointer-events-none"
    )}>
      <Link 
        href="/cart"
        prefetch={false}
        className="w-full relative overflow-hidden bg-gradient-to-r from-[#C5A021] via-[#D4AF37] to-[#B8860B] text-white rounded-[1.25rem] flex items-center justify-between px-5 py-2.5 shadow-[0_15px_40px_rgba(197,160,33,0.25)] border-2 border-white/20 active:scale-[0.96] transition-all duration-300 group pointer-events-auto animate-in slide-in-from-bottom-4"
      >
        {/* Continuous Shine Animation Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shine_3s_infinite] pointer-events-none" />
        
        {/* Background Decor */}
        <div className="absolute top-0 right-0 h-full w-24 bg-white/10 -skew-x-12 translate-x-10 pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-white/20 backdrop-blur-md h-8 w-8 rounded-xl flex items-center justify-center border border-white/30 shadow-inner group-hover:rotate-6 transition-transform">
            <ShoppingCart className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1">
              <span className="text-[7px] font-black uppercase tracking-[0.2em] text-white/80">Premium Bag</span>
              <Sparkles className="h-2 w-2 text-white animate-pulse" />
            </div>
            <span className="text-sm font-black italic tracking-tighter leading-none">
              ₹{totalPrice.toFixed(0)}
              <span className="ml-1.5 text-[8px] font-bold opacity-60 not-italic uppercase tracking-widest">({totalItems})</span>
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 relative z-10">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black uppercase tracking-widest italic text-white leading-none">Proceed</span>
            <span className="text-[6px] font-bold text-white/60 uppercase tracking-[0.1em]">Checkout</span>
          </div>
          <div className="bg-white text-[#B8860B] p-1.5 rounded-lg shadow-lg group-active:translate-x-1 transition-transform">
            <ArrowRight className="h-3.5 w-3.5 stroke-[3]" />
          </div>
        </div>
      </Link>
    </div>
  );
}
