
"use client"

import { useCart } from '@/components/cart/CartProvider';
import { ShoppingCart, ArrowRight, Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

/**
 * @fileOverview Compact Luxury White & Golden Floating Cart.
 * Updated: Disabled on product pages to avoid overlapping with action bar.
 */
export default function FloatingCart() {
  const { totalItems, totalPrice } = useCart();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const isHiddenPage = ['/cart', '/admin', '/vendor', '/delivery', '/Medical', '/Beauty', '/product'].some(path => pathname?.startsWith(path));
    
    if (totalItems > 0 && !isHiddenPage) {
      setIsVisible(true);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = setTimeout(() => { setIsVisible(false); }, 5000);
    } else {
      setIsVisible(false);
    }

    return () => { if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current); };
  }, [totalItems, pathname]);

  if (totalItems === 0) return null;

  return (
    <div className={cn(
      "fixed bottom-[74px] left-4 right-4 z-[9998] transition-all duration-700 ease-premium transform-gpu pointer-events-none",
      isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-90 pointer-events-none"
    )}>
      <div className={cn("w-full flex justify-center", isVisible && "animate-float")}>
        <Link 
          href="/cart"
          prefetch={false}
          className="w-full max-w-[280px] relative overflow-hidden bg-white text-[#B8860B] rounded-2xl flex items-center justify-between px-4 py-2 shadow-[0_0_20px_rgba(197,160,33,0.3)] border-2 border-[#C5A021] active:scale-[0.96] transition-all duration-300 group pointer-events-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C5A021]/10 to-transparent -translate-x-full animate-shine pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="bg-[#C5A021]/10 backdrop-blur-md h-7 w-7 rounded-xl flex items-center justify-center border border-[#C5A021]/20 shadow-inner">
              <ShoppingCart className="h-3.5 w-3.5 text-[#B8860B]" />
            </div>
            <div className="flex flex-col items-start leading-none">
              <div className="flex items-center gap-1">
                <span className="text-[7px] font-black uppercase tracking-widest text-[#B8860B]/70">View Bag</span>
                <Sparkles className="h-2 w-2 text-[#C5A021] animate-pulse" />
              </div>
              <span className="text-sm font-black italic tracking-tighter mt-0.5 text-gray-900">
                ₹{totalPrice.toFixed(0)}
                <span className="ml-1 text-[8px] font-bold opacity-40 not-italic uppercase tracking-widest">({totalItems})</span>
              </span>
            </div>
          </div>
          <div className="bg-[#C5A021] text-white h-7 w-7 rounded-lg shadow-lg flex items-center justify-center group-active:translate-x-1 transition-transform relative z-10">
            <ArrowRight className="h-3.5 w-3.5 stroke-[3]" />
          </div>
        </Link>
      </div>
    </div>
  );
}
