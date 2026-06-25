
"use client"

import { useCart } from '@/components/cart/CartProvider';
import { ShoppingCart, ArrowRight, Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

/**
 * @fileOverview Luxury Golden Floating Cart.
 * Features: 5s Auto-dismiss, Shine Animation, Premium Gold Styling.
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
      "fixed bottom-[72px] left-4 right-4 z-[9998] transition-all duration-700 ease-premium transform-gpu pointer-events-none",
      isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-90 pointer-events-none"
    )}>
      <Link 
        href="/cart"
        prefetch={false}
        className="w-full relative overflow-hidden bg-gradient-to-r from-[#C5A021] via-[#D4AF37] to-[#B8860B] text-white rounded-[1.75rem] flex items-center justify-between px-6 shadow-[0_20px_50px_rgba(197,160,33,0.3)] border-2 border-white/20 active:scale-[0.96] transition-all duration-300 group pointer-events-auto py-4 animate-in slide-in-from-bottom-4"
      >
        {/* Continuous Shine Animation Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shine_3s_infinite] pointer-events-none" />
        
        {/* Background Decor */}
        <div className="absolute top-0 right-0 h-full w-32 bg-white/10 -skew-x-12 translate-x-10 pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="bg-white/20 backdrop-blur-md h-11 w-11 rounded-2xl flex items-center justify-center border border-white/30 shadow-inner group-hover:rotate-6 transition-transform">
            <ShoppingCart className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/80">Premium Bag</span>
              <Sparkles className="h-2.5 w-2.5 text-white animate-pulse" />
            </div>
            <span className="text-lg font-black italic tracking-tighter leading-none">
              ₹{totalPrice.toFixed(2)}
              <span className="ml-2 text-[10px] font-bold opacity-60 not-italic uppercase tracking-widest">({totalItems} Items)</span>
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-widest italic text-white leading-none">Proceed</span>
            <span className="text-[7px] font-bold text-white/60 uppercase tracking-[0.2em]">Secure Checkout</span>
          </div>
          <div className="bg-white text-[#B8860B] p-2 rounded-xl shadow-lg group-active:translate-x-1 transition-transform">
            <ArrowRight className="h-4 w-4 stroke-[3]" />
          </div>
        </div>
      </Link>
    </div>
  );
}
