
"use client"

import { useEffect, useState } from 'react';
import { Check, Coins, Sparkles, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Snappy Order Success Overlay with Cinematic Green Tick Animation.
 * Optimized for a 1.5s total display window with auto-dismiss feel.
 */
export function OrderSuccessOverlay({ isVisible }: { isVisible: boolean }) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-[1000000] flex items-center justify-center transition-all duration-300",
      isVisible ? "opacity-100 backdrop-blur-xl bg-black/70" : "opacity-0 pointer-events-none"
    )}>
      <div className={cn(
        "relative flex flex-col items-center justify-center p-12 rounded-[4rem] bg-white shadow-2xl transition-all duration-500 transform transform-gpu",
        isVisible ? "scale-100 rotate-0" : "scale-50 rotate-12"
      )}>
        {/* Animated Rings - Pulse Energy */}
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-48 h-48 bg-green-100 rounded-full animate-ping opacity-20" style={{ animationDuration: '1s' }} />
           <div className="absolute w-32 h-32 bg-green-50 rounded-full animate-pulse opacity-40" />
        </div>

        {/* GREEN TICK CONTAINER */}
        <div className="relative z-10 mb-8">
           <div className="h-28 w-28 bg-green-500 rounded-full flex items-center justify-center shadow-[0_20px_50px_rgba(22,163,74,0.4)] border-[6px] border-white animate-in zoom-in duration-500">
             <Check className="h-16 w-16 text-white stroke-[4] animate-in slide-in-from-bottom-2 duration-300 delay-150" />
           </div>
           
           {/* Confetti Sparkles */}
           <Sparkles className="absolute -top-4 -right-4 h-10 w-10 text-amber-400 animate-bounce" />
           <Star className="absolute -bottom-2 -left-6 h-8 w-8 text-amber-500 animate-pulse fill-amber-500" />
        </div>

        <div className="text-center space-y-2 relative z-10">
          <h2 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
            ORDER<br /><span className="text-green-600">PLACED!</span>
          </h2>
          
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">
            Cooking starts now
          </p>
        </div>

        {/* COIN REWARD BADGE */}
        <div className="mt-10 relative z-10 animate-in zoom-in slide-in-from-bottom-4 duration-500 delay-300">
           <div className="bg-gradient-to-r from-amber-400 to-amber-600 p-[2px] rounded-2xl shadow-xl shadow-amber-100">
              <div className="bg-white rounded-[0.8rem] px-6 py-3 flex items-center gap-3">
                 <div className="bg-amber-100 p-2 rounded-xl">
                    <Coins className="h-6 w-6 text-amber-600 fill-amber-500" />
                 </div>
                 <div className="text-left">
                    <span className="block text-[8px] font-black text-amber-600 uppercase tracking-widest leading-none mb-1">Loyalty Perk</span>
                    <h4 className="text-lg font-black text-gray-800 leading-none">+10 Coins</h4>
                 </div>
              </div>
           </div>
        </div>

        {/* Running Progress Line at bottom */}
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gray-50 overflow-hidden rounded-b-[4rem]">
           <div className="h-full bg-green-500 animate-[running-line_1.5s_linear]" style={{ width: '100%' }} />
        </div>
      </div>
      
      {/* Floating particles */}
      <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-white rounded-full animate-ping opacity-20" />
      <div className="absolute bottom-1/4 right-1/4 w-4 h-4 bg-white rounded-full animate-ping opacity-10" />
    </div>
  );
}
