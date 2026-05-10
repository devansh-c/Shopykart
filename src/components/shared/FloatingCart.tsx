"use client"

import { useCart } from '@/components/cart/CartProvider';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';

export function FloatingCart() {
  const { totalItems, totalPrice } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const prevItemsRef = useRef(totalItems);

  useEffect(() => {
    // Show notification only when an item is added (count increases)
    if (totalItems > prevItemsRef.current) {
      setIsVisible(true);
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
    
    // Update ref for next check
    prevItemsRef.current = totalItems;
    
    // If cart becomes empty, hide it immediately
    if (totalItems === 0) {
      setIsVisible(false);
    }
  }, [totalItems]);

  const isHiddenPage = ['/cart', '/admin', '/login'].some(path => pathname?.startsWith(path));
  
  if (isHiddenPage || totalItems === 0 || !isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 animate-in fade-in slide-in-from-bottom-10 duration-500">
      <button 
        onClick={() => router.push('/cart')}
        className="w-full h-14 bg-[#0B0B0B] text-white rounded-2xl flex items-center justify-between px-5 shadow-2xl border border-white/5 active:scale-[0.98] transition-all group animate-jump"
      >
        <div className="flex items-center gap-3">
          <div className="bg-primary h-10 w-10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Item Added</span>
              <span className="h-1 w-1 bg-gray-600 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{totalItems} Total</span>
            </div>
            <span className="text-base font-black italic tracking-tight">₹{totalPrice.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-widest italic group-hover:mr-1 transition-all">View Cart</span>
          <div className="bg-white/10 p-1 rounded-full group-hover:bg-primary transition-colors">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </button>
    </div>
  );
}
