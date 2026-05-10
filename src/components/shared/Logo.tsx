
"use client"

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className="border-[1px] border-[#C5A021] rounded-lg px-2 py-0.5 flex flex-col items-center leading-none">
        <span className="text-white font-black text-sm tracking-tight">Shopy</span>
        <span className="text-[#C5A021] font-black text-sm tracking-tight -mt-0.5">kart</span>
      </div>
    </div>
  );
}
