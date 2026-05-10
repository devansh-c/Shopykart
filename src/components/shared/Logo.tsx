
"use client"

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-start select-none", className)}>
      <div className="relative transform -rotate-6">
        <h1 className="text-3xl font-black italic tracking-tighter text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
          ShopyKart
        </h1>
        <div className="absolute -bottom-1 left-0 w-full flex justify-center">
          <div className="bg-amber-400 px-2 py-0.5 rounded-sm transform rotate-1 shadow-sm">
            <span className="text-[7px] font-black uppercase text-black leading-none tracking-widest">
              Quality First
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
