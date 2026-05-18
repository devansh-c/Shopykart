
"use client"

import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

export function Logo({ className }: { className?: string }) {
  const [taps, setTaps] = useState(0);
  const router = useRouter();
  const firestore = useFirestore();

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);

  const { data: branding } = useDoc<any>(brandingRef);

  const handleTap = () => {
    const nextTaps = taps + 1;
    if (nextTaps >= 5) {
      setTaps(0);
      router.push('/admin/login');
    } else {
      setTaps(nextTaps);
      setTimeout(() => setTaps(0), 2000);
    }
  };

  return (
    <div 
      onClick={handleTap}
      className={cn(
        "flex flex-col items-center cursor-pointer select-none active:scale-95 transition-transform px-4 py-2 border border-[#C5A021]/30 rounded-[1.8rem] bg-black/40 backdrop-blur-md shadow-[0_0_20px_rgba(197,160,33,0.1)] min-w-[120px] justify-center h-14", 
        className
      )}
    >
      {branding?.logoUrl ? (
        <img src={branding.logoUrl} alt={branding.siteTitle || 'Logo'} className="h-10 w-auto object-contain" />
      ) : (
        <>
          <h1 className="flex items-center text-lg font-black italic tracking-tighter leading-none">
            <span className="text-white">SHOPY</span>
            <span className="text-[#C5A021]">KART</span>
          </h1>
          <span className="text-[7px] font-black uppercase tracking-[0.25em] text-white/40 mt-1.5">
            QUALITY FIRST
          </span>
        </>
      )}
    </div>
  );
}
