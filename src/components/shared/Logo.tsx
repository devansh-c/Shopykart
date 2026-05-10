
"use client"

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="border-[1.5px] border-[#C5A021] rounded-xl px-2 py-1 flex flex-col items-center leading-none">
        <span className="text-white font-black text-xl tracking-tight">Shopy</span>
        <span className="text-[#C5A021] font-black text-xl tracking-tight -mt-1">kart</span>
      </div>
      <span className="text-[6px] text-gray-400 font-bold tracking-[0.2em] mt-1 uppercase">
        Quality First
      </span>
    </div>
  );
}
