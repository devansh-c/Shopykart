"use client"

import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function Logo({ className }: { className?: string }) {
  const [taps, setTaps] = useState(0);
  const router = useRouter();

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
        "flex flex-col items-center cursor-pointer select-none active:scale-95 transition-transform px-5 py-2 border border-[#C5A021]/40 rounded-2xl bg-black/40 backdrop-blur-md shadow-[0_0_20px_rgba(197,160,33,0.15)]", 
        className
      )}
    >
      <h1 className="flex items-center text-xl font-black italic tracking-tighter leading-none">
        <span className="text-white">SHOPY</span>
        <span className="text-[#C5A021]">KART</span>
      </h1>
      <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/50 mt-1">
        QUALITY FIRST
      </span>
    </div>
  );
}
