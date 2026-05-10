
"use client"

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center select-none", className)}>
      <h1 className="text-2xl font-black italic tracking-tighter text-white leading-none">
        ShopyKart
      </h1>
    </div>
  );
}
