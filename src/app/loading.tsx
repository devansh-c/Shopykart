
import { Loader2 } from "lucide-react";

/**
 * @fileOverview Refined Fast Loading UI.
 * Simplified to prevent rendering freezes on weak mobile networks.
 */
export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-[999999]">
      <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
        <div className="h-16 w-16 rounded-[1.5rem] bg-primary/5 flex items-center justify-center text-primary border border-primary/10 shadow-inner">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <div className="flex flex-col items-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 italic animate-pulse">
            ShopyKart Premium
          </p>
          <p className="text-[7px] font-bold text-gray-300 uppercase tracking-widest mt-1">Initializing Secure Network</p>
        </div>
      </div>
    </div>
  );
}
