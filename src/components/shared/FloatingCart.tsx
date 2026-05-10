
"use client"

import { useCart } from '@/components/cart/CartProvider';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export function FloatingCart() {
  const { totalItems, totalPrice } = useCart();
  const pathname = usePathname();
  const router = useRouter();

  const isHidden = ['/cart', '/admin', '/login'].some(path => pathname?.startsWith(path));
  
  if (isHidden || totalItems === 0) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 animate-in slide-in-from-bottom-10 duration-500">
      <button 
        onClick={() => router.push('/cart')}
        className="w-full h-14 bg-[#0B0B0B] text-white rounded-2xl flex items-center justify-between px-5 shadow-2xl border border-white/5 active:scale-[0.98] transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="bg-primary h-10 w-10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{totalItems} Item{totalItems > 1 ? 's' : ''} Added</span>
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
