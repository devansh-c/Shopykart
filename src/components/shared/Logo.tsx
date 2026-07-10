
"use client"

import { cn } from "@/lib/utils";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

/**
 * @fileOverview Logo component updated to match the pill-style design from the user's provided image.
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
        "flex flex-col items-center cursor-pointer select-none active:scale-95 transition-all duration-300 px-8 py-2 border-2 border-[#C5A021]/40 rounded-full bg-black/60 backdrop-blur-md shadow-[0_0_25px_rgba(197,160,33,0.15)] min-w-[160px] justify-center h-12", 
        className
      )}
    >
      {branding?.logoUrl ? (
        <img src={branding.logoUrl} alt={branding.siteTitle || 'Logo'} className="h-6 w-auto object-contain" />
      ) : (
        <>
          <h1 className="flex items-center text-xl font-black italic tracking-tighter leading-none">
            <span className="text-white">SHOPY</span>
            <span className="text-[#C5A021]">KART</span>
          </h1>
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#C5A021]/40 to-transparent mt-1 opacity-50" />
          <span className="text-[6px] font-black uppercase tracking-[0.3em] text-white/40 mt-1">
            QUALITY FIRST
          </span>
        </>
      )}
    </div>
  );
}
