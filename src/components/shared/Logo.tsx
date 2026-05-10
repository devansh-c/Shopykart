"use client"

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative w-12 h-12">
        {/* Logo Icon inspired by the image */}
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="48" fill="#ce1126" stroke="#000" strokeWidth="1" />
          <circle cx="50" cy="50" r="38" fill="#e9d8b1" stroke="#000" strokeWidth="1" />
          {/* Fork */}
          <path d="M42 35 v15 m-3 -15 v8 m6 -8 v8 M42 50 v15" stroke="#ce1126" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Knife */}
          <path d="M58 35 q5 0 5 15 v15 h-5 v-30" fill="#ce1126" stroke="#ce1126" strokeWidth="1" />
        </svg>
      </div>
      <div className="mt-1 flex flex-col items-center leading-none">
        <span className="text-xl font-bold tracking-tight text-white drop-shadow-sm">shopykart</span>
        <span className="text-[8px] font-serif italic text-white/90">---eats---</span>
      </div>
    </div>
  );
}
