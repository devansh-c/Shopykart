'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Sparkles } from 'lucide-react';

/**
 * @fileOverview High-end animated Splash Screen with shimmer effects.
 * Optimized to be used as both an app-ready indicator and a fallback loader.
 */
export function SplashScreen({ isAppReady = false }: { isAppReady?: boolean }) {
  const [shouldExit, setShouldExit] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isAppReady) {
      // Small delay for smooth exit animation
      const timer = setTimeout(() => setShouldExit(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isAppReady]);

  if (shouldExit) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-[999999] bg-[#0B0B0B] flex flex-col items-center justify-center transition-all duration-1000 ease-premium",
      (isAppReady && mounted) ? "opacity-0 scale-110 pointer-events-none" : "opacity-100 scale-100"
    )}>
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/5 blur-[100px] rounded-full animate-pulse delay-700" />
      </div>

      <div className="relative flex flex-col items-center gap-10">
        {/* Animated Logo Container */}
        <div className="relative group">
           <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
           <div className="relative h-28 w-28 rounded-[2.5rem] bg-white/5 border-2 border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xl animate-in zoom-in duration-700">
              <div className="flex flex-col items-center">
                <h1 className="text-3xl font-black italic tracking-tighter text-white leading-none">SHOPY</h1>
                <h1 className="text-3xl font-black italic tracking-tighter text-primary leading-none -mt-1">KART</h1>
              </div>
              <Sparkles className="absolute -top-3 -right-3 h-8 w-8 text-primary animate-bounce" />
           </div>
        </div>

        {/* Text & Progress */}
        <div className="flex flex-col items-center gap-4 text-center">
           <div className="space-y-1">
              <h2 className="text-white text-[10px] font-black uppercase tracking-[0.5em] opacity-40">
                Premium Gourmet Network
              </h2>
              <div className="flex items-center justify-center gap-2">
                 <Loader2 className="h-3 w-3 animate-spin text-primary" />
                 <span className="text-primary text-[8px] font-black uppercase tracking-widest">
                   {isAppReady ? 'READY TO SERVE' : 'INITIALIZING HUB...'}
                 </span>
              </div>
           </div>
           
           {/* Custom Progress Bar */}
           <div className="w-48 h-[2px] bg-white/5 rounded-full overflow-hidden relative">
              <div 
                className={cn(
                  "h-full bg-primary transition-all duration-[2000ms] ease-out",
                  isAppReady ? "w-full" : "w-[60%] animate-pulse"
                )} 
              />
           </div>
        </div>
      </div>

      {/* Corporate Footer */}
      <div className="absolute bottom-12 flex flex-col items-center gap-2 opacity-20">
         <p className="text-[7px] font-black text-white uppercase tracking-[0.6em]">ShopyKart Private Limited</p>
         <div className="flex items-center gap-4">
            <div className="h-0.5 w-8 bg-white/40" />
            <div className="h-1 w-1 bg-white rounded-full" />
            <div className="h-0.5 w-8 bg-white/40" />
         </div>
      </div>
    </div>
  );
}
