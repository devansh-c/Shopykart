"use client"

import { cn } from "@/lib/utils";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

/**
 * @fileOverview Logo component using dynamic branding or fallback placeholder.
 * Fixed: Removed non-existent file reference that was causing 404/Server Error.
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

  const handleTap = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const nextTaps = taps + 1;
    if (nextTaps >= 5) {
      setTaps(0);
      router.push('/admin/dashboard');
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
      {branding?.logoUrl ? (
        <img 
          src={branding.logoUrl} 
          alt="ShopyKart Logo" 
          className="h-8 w-auto object-contain" 
        />
      ) : (
        <div className="flex flex-col items-center">
           <span className="text-white font-black italic text-sm tracking-tighter leading-none">SHOPYKART</span>
           <span className="text-[6px] font-black text-primary uppercase tracking-[0.3em]">Premium Delivery</span>
        </div>
      )}
    </div>
  );
}
