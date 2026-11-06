import { Loader2 } from "lucide-react";

/**
 * @fileOverview Atomic Fast Loading UI.
 * Fixed "Frozen Spinner" issue by using standard absolute centering and removing complex animations.
 */
export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-[999999]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 flex items-center justify-center text-primary">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
        <div className="flex flex-col items-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-900 italic">
            ShopyKart
          </p>
          <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gourmet Delivery Network</p>
        </div>
      </div>
    </div>
  );
}