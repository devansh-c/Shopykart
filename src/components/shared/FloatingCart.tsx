"use client"

import { useCart } from '@/components/cart/CartProvider';
import { ShoppingCart, ArrowRight, Sparkles } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';
import { useUser } from '@/firebase';

/**
 * @fileOverview View Cart Bar - Matched to the dark metallic look from the screenshot.
 * Updated to trigger login for guest users.
 */
export default function FloatingCart() {
  const { totalItems, totalPrice } = useCart();
  const { user } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isHiddenPage = ['/cart', '/admin', '/vendor', '/delivery', '/Medical', '/Beauty'].some(path => pathname?.startsWith(path));
    
    if (totalItems > 0 && !isHiddenPage) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [totalItems, pathname]);

  const handleCartClick = () => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('open-auth-overlay'));
      return;
    }
    router.push('/cart');
  };

  if (totalItems === 0 || !isVisible) return null;

  return (
    <div className="fixed bottom-[88px] left-4 right-4 z-[9998] transition-all duration-500 ease-out transform-gpu pointer-events-none">
      <div className="w-full flex justify-center">
        <button 
          onClick={handleCartClick}
          className="w-full relative overflow-hidden bg-gradient-to-b from-[#3D3528] to-[#1A1612] text-[#D9C4A9] rounded-[1.25rem] flex items-center justify-center py-4 px-6 shadow-2xl border border-white/5 active:scale-[0.98] transition-all pointer-events-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shine pointer-events-none" />
          <span className="text-sm font-black italic uppercase tracking-widest flex items-center gap-3">
            View Cart ({totalItems} items)
            <ArrowRight className="h-4 w-4" />
          </span>
        </button>
      </div>
    </div>
  );
}
