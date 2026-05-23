"use client"

import { useEffect, useState } from 'react';
import { Check, Coins, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OrderSuccessOverlay({ isVisible }: { isVisible: boolean }) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      // Play order placed ring sound
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.log("Audio play blocked by browser"));
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-[200] flex items-center justify-center transition-all duration-500",
      isVisible ? "opacity-100 backdrop-blur-md bg-black/60" : "opacity-0 pointer-events-none"
    )}>
      <div className={cn(
        "relative flex flex-col items-center justify-center p-10 rounded-[3rem] bg-white shadow-2xl transition-all duration-700 transform",
        isVisible ? "scale-100 rotate-0" : "scale-50 rotate-12"
      )}>
        {/* Animated Rings */}
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-32 h-32 bg-green-100 rounded-full animate-ping opacity-20" />
           <div className="absolute w-24 h-24 bg-green-50 rounded-full animate-pulse opacity-40" />
        </div>

        <div className="relative z-10 bg-green-500 h-20 w-20 rounded-full flex items-center justify-center shadow-xl shadow-green-200 mb-6">
          <Check className="h-10 w-10 text-white stroke-[4]" />
        </div>

        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-black text-center leading-none mb-2">
          ORDER<br /><span className="text-green-500">PLACED!</span>
        </h2>
        
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center mb-8">
          Preparing your deliciousness
        </p>

        {/* COIN REWARD SECTION */}
        <div className="relative z-10 animate-in zoom-in slide-in-from-bottom-4 duration-700 delay-300">
           <div className="bg-gradient-to-r from-amber-400 to-amber-600 p-0.5 rounded-2xl shadow-lg shadow-amber-200">
              <div className="bg-white rounded-[0.9rem] px-5 py-3 flex items-center gap-3">
                 <div className="bg-amber-100 p-2 rounded-xl">
                    <Coins className="h-6 w-6 text-amber-600 fill-amber-500" />
                 </div>
                 <div className="text-left">
                    <span className="block text-[8px] font-black text-amber-600 uppercase tracking-widest leading-none mb-1">Bonus Reward</span>
                    <h4 className="text-lg font-black text-gray-800 leading-none">+10 Bonus Coins</h4>
                 </div>
                 <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
              </div>
           </div>
        </div>

        {/* Floating Confetti dots */}
        <div className="absolute -top-4 -left-4 w-3 h-3 bg-red-400 rounded-full animate-bounce delay-100" />
        <div className="absolute top-10 -right-2 w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-300" />
        <div className="absolute -bottom-2 right-10 w-3 h-3 bg-yellow-400 rounded-full animate-bounce delay-500" />
      </div>
    </div>
  );
}
