import { Loader2 } from "lucide-react";

/**
 * @fileOverview Premium Pure White FAST Loading UI.
 * Highly simplified to prevent rendering delays.
 */
export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-[1000000]">
      <div className="relative">
        <div className="h-16 w-16 rounded-[1.5rem] bg-primary/5 flex items-center justify-center text-primary border border-primary/10 shadow-inner">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 italic animate-pulse">
            ShopyKart Premium
          </p>
        </div>
      </div>
    </div>
  );
}
