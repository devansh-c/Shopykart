
"use client"

import { useCart } from '@/components/cart/CartProvider';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export function FloatingCart() {
  const { totalItems, totalPrice } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const firestore = useFirestore();
  const [isVisible, setIsVisible] = useState(false);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(0);
  const prevItemsRef = useRef(totalItems);

  // Fetch Heat Wave Status
  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);
  const { data: settings } = useDoc<any>(brandingRef);

  useEffect(() => {
    if (totalItems > prevItemsRef.current) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsVisible(false), 5000);
      return () => clearTimeout(timer);
    }
    prevItemsRef.current = totalItems;
    if (totalItems === 0) setIsVisible(false);
  }, [totalItems]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const isInRange = useMemo(() => {
    if (!settings?.heatWaveStartTime || !settings?.heatWaveEndTime) return false;
    const parseTimeToMinutes = (timeStr: string) => {
      try {
        const [time, modifier] = timeStr.trim().split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        return hours * 60 + (minutes || 0);
      } catch (e) { return -1; }
    };
    const start = parseTimeToMinutes(settings.heatWaveStartTime);
    const end = parseTimeToMinutes(settings.heatWaveEndTime);
    if (start === -1 || end === -1) return false;
    return start < end 
      ? (currentTimeMinutes >= start && currentTimeMinutes <= end)
      : (currentTimeMinutes >= start || currentTimeMinutes <= end);
  }, [settings, currentTimeMinutes]);

  const isHiddenPage = ['/cart', '/admin', '/login'].some(path => pathname?.startsWith(path));
  const isExcludedPath = pathname?.startsWith('/admin') || pathname?.startsWith('/vendor') || pathname?.startsWith('/delivery');
  
  // Logic to determine if restriction is active
  const isRestrictionActive = (settings?.isHeatWaveEnabled === true) || (settings?.heatWaveAutoMode === true && isInRange);
  
  if (isHiddenPage || totalItems === 0 || !isVisible || (isRestrictionActive && !isExcludedPath)) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 animate-in fade-in slide-in-from-bottom-10 duration-500">
      <button 
        onClick={() => router.push('/cart')}
        className="w-full h-14 bg-[#0B0B0B] text-white rounded-2xl flex items-center justify-between px-5 shadow-2xl border border-white/5 active:scale-[0.98] transition-all group animate-jump"
      >
        <div className="flex items-center gap-3">
          <div className="bg-primary h-10 w-10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <ShoppingCart className="h-5 w-5" />
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
