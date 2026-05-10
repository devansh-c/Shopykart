
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
        "flex items-center cursor-pointer select-none active:scale-95 transition-transform px-4 py-1.5 border border-[#C5A021]/40 rounded-xl bg-black/20 backdrop-blur-sm shadow-[0_0_15px_rgba(197,160,33,0.1)]", 
        className
      )}
    >
      <h1 className="text-white font-black italic text-xl tracking-tighter">
        SHOPYKART <span className="text-primary">EATS</span>
      </h1>
    </div>
  );
}
