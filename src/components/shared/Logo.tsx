
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
      <div className="flex items-center gap-3">
        {/* Utensils Circle Icon */}
        <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center border-2 border-primary/20 shadow-lg relative overflow-hidden">
            <div className="bg-[#E5D5C0] h-7 w-7 rounded-full flex items-center justify-center border-[1.5px] border-black/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                    <path d="M7 3V11M7 11C7 12.1046 7.89543 13 9 13V15C9 15.5523 8.55228 16 8 16H6C5.44772 16 5 15.5523 5 15V13C6.10457 13 7 12.1046 7 11ZM7 3C5.89543 3 5 3.89543 5 5V9M7 3C8.10457 3 9 3.89543 9 5V9M17 3V21M17 3C18.1046 3 19 3.89543 19 5V11C19 12.1046 18.1046 13 17 13M17 3C15.8954 3 15 3.89543 15 5V11C15 12.1046 15.8954 13 17 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
        </div>

        <div className="flex flex-col items-start leading-none">
            <div className="flex items-baseline">
                <span className="text-white font-medium text-2xl tracking-tighter lowercase font-body">shopykart</span>
                <span className="text-white font-bold text-[10px] ml-0.5 align-top uppercase">TM</span>
            </div>
            <div className="w-full flex justify-end -mt-1">
                <span className="text-white font-bold text-[11px] tracking-widest italic" style={{ fontFamily: "'Dancing Script', cursive" }}>---eats---</span>
            </div>
        </div>
      </div>
    </div>
  );
}
