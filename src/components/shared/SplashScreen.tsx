'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * @fileOverview High-end Minimalist Splash Screen.
 * Design: Pure black background, center pill logo (static), and golden line loader at the bottom.
 */
export function SplashScreen({ isAppReady = false }: { isAppReady?: boolean }) {
  const [shouldExit, setShouldExit] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isAppReady) {
      // Smooth exit transition
      const timer = setTimeout(() => setShouldExit(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [isAppReady]);

  if (shouldExit) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-[999999] bg-black flex flex-col items-center justify-center transition-opacity duration-700 ease-premium",
      (isAppReady && mounted) ? "opacity-0 pointer-events-none" : "opacity-100"
    )}>
      {/* Centered Logo Container - Static design as requested */}
      <div className="relative flex flex-col items-center px-12 py-5 border-2 border-[#C5A021]/30 rounded-[3rem] bg-black shadow-[0_0_50px_rgba(197,160,33,0.1)]">
        <div className="flex items-center text-4xl sm:text-5xl font-black italic tracking-tighter leading-none select-none">
          <span className="text-white">SHOPY</span>
          <span className="text-[#C5A021]">KART</span>
        </div>
        
        {/* Elegant Separator Line */}
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#C5A021]/50 to-transparent mt-3 opacity-60" />
        
        {/* Slogan */}
        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.5em] text-white/40 mt-3 select-none">
          QUALITY FIRST
        </span>
      </div>

      {/* Golden loading line at the very bottom - Animated */}
      <div className="absolute bottom-0 left-0 w-full h-[4px] bg-white/5 overflow-hidden">
        <div 
          className={cn(
            "h-full bg-[#C5A021] transition-all duration-[2000ms] ease-out shadow-[0_0_15px_#C5A021]",
            isAppReady ? "w-full" : "w-1/3 animate-running-line"
          )} 
        />
      </div>
    </div>
  );
}
