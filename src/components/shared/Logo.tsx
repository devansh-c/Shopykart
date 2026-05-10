
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
      // Reset taps after 2 seconds of inactivity
      setTimeout(() => setTaps(0), 2000);
    }
  };

  return (
    <div 
      onClick={handleTap}
      className={cn("flex flex-col items-center justify-center cursor-pointer select-none active:scale-95 transition-transform", className)}
    >
      <div className="border-[1px] border-[#C5A021] rounded-lg px-2 py-0.5 flex flex-col items-center leading-none">
        <span className="text-white font-black text-sm tracking-tight">Shopy</span>
        <span className="text-[#C5A021] font-black text-sm tracking-tight -mt-0.5">kart</span>
      </div>
    </div>
  );
}
