
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
      className={cn("flex items-center cursor-pointer select-none active:scale-95 transition-transform", className)}
    >
      <h1 className="text-white font-black italic text-2xl tracking-tighter">
        SHOPYKART <span className="text-primary">EATS</span>
      </h1>
    </div>
  );
}
