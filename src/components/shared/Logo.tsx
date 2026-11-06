"use client"

import { cn } from "@/lib/utils";
import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

/**
 * @fileOverview Logo component with Advanced Multi-App Switching for Preview mode.
 */
export function Logo({ className }: { className?: string }) {
  const [taps, setTaps] = useState(0);
  const router = useRouter();
  const firestore = useFirestore();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);

  const { data: branding } = useDoc<any>(brandingRef);

  const currentAppType = useMemo(() => {
    if (typeof window === 'undefined') return 'customer';
    if (process.env.NEXT_PUBLIC_ADMIN_APP === 'true') return 'admin';
    if (process.env.NEXT_PUBLIC_BIZ_APP === 'true') return 'biz';
    if (process.env.NEXT_PUBLIC_TOW_APP === 'true') return 'tow';
    return localStorage.getItem('shopykart_dev_app_type') || 'customer';
  }, []);

  const displayLogo = useMemo(() => {
    if (!branding) return null;
    if (currentAppType === 'biz' && branding.bizLogoUrl) return branding.bizLogoUrl;
    return branding.logoUrl || null;
  }, [branding, currentAppType]);

  const handleTap = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const nextTaps = taps + 1;
    
    if (nextTaps >= 5) {
      setTaps(0);
      // For Dev Preview: Cycle through app types on 5 taps
      if (process.env.NODE_ENV === 'development') {
        const types = ['customer', 'admin', 'biz', 'tow'];
        const nextType = types[(types.indexOf(currentAppType) + 1) % types.length];
        localStorage.setItem('shopykart_dev_app_type', nextType);
        alert(`Preview Mode Switched to: ${nextType.toUpperCase()}`);
        window.location.reload();
      } else {
        router.push('/admin/dashboard');
      }
    } else {
      setTaps(nextTaps);
      timerRef.current = setTimeout(() => {
        setTaps(0);
      }, 2000);
    }
  };

  return (
    <div 
      onClick={handleTap}
      className={cn(
        "flex flex-col items-center cursor-pointer select-none active:scale-95 transition-all duration-300 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md shadow-lg min-w-[140px] justify-center h-10 border border-white/5", 
        className
      )}
    >
      {displayLogo ? (
        <img 
          src={displayLogo} 
          alt="ShopyKart Logo" 
          className="h-8 w-auto object-contain" 
        />
      ) : (
        <div className="flex flex-col items-center">
           <span className="text-white font-black italic text-sm tracking-tighter leading-none">SHOPYKART</span>
           <span className="text-[6px] font-black text-primary uppercase tracking-[0.3em]">
             {currentAppType === 'biz' ? 'STORE PARTNER' : currentAppType === 'admin' ? 'CEO CONTROL' : currentAppType === 'tow' ? 'FLEET PANEL' : 'Premium Delivery'}
           </span>
        </div>
      )}
    </div>
  );
}