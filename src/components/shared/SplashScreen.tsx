'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * @fileOverview High-end Minimalist Splash Screen.
 * Optimized: Fixed hydration issues and improved exit speed for premium feel.
 */
export function SplashScreen({ isAppReady = false }: { isAppReady?: boolean }) {
  const [shouldExit, setShouldExit] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isAppReady) {
      // Small delay for the final scale-up transition
      const timer = setTimeout(() => setShouldExit(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isAppReady]);

  // Prevent any rendering on server to avoid hydration mismatch
  if (!mounted || shouldExit) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-[999999] bg-black flex flex-col items-center justify-center transition-all duration-700 ease-premium transform-gpu",
      isAppReady ? "opacity-0 pointer-events-none scale-110 blur-xl" : "opacity-100"
    )}>
      {/* Main Logo Container - Luxury Box */}
      <div className="relative flex flex-col items-center px-12 py-8 border-2 border-[#C5A021]/20 rounded-[3.5rem] bg-black shadow-[0_0_100px_rgba(197,160,33,0.1)] animate-in fade-in zoom-in duration-1000">
        
        {/* Glowing Aura behind Logo */}
        <div className="absolute inset-0 bg-[#C5A021]/5 blur-[60px] rounded-full animate-pulse pointer-events-none" />

        <div className="relative flex items-center text-5xl sm:text-7xl font-black italic tracking-tighter leading-none select-none">
          <span className="text-white drop-shadow-lg">SHOPY</span>
          <span className="text-[#C5A021] drop-shadow-[0_0_15px_rgba(197,160,33,0.4)] ml-1">KART</span>
        </div>
        
        {/* Elegant Gold Separator */}
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#C5A021]/40 to-transparent mt-5 opacity-60" />
        
        {/* Luxury Slogan */}
        <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.5em] text-white/30 mt-5 select-none text-center italic">
          QUALITY FIRST DELIVERY
        </span>
      </div>

      {/* Reflective Gloss Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent pointer-events-none" />

      {/* Bottom Loading Indicator */}
      <div className="absolute bottom-0 left-0 w-full h-[4px] bg-white/[0.03] overflow-hidden">
        <div 
          className={cn(
            "h-full bg-[#C5A021] shadow-[0_0_20px_#C5A021] transition-all duration-500 ease-out",
            isAppReady ? "w-full" : "w-1/4 animate-running-line"
          )} 
        />
      </div>

      {/* Version Tag */}
      <div className="absolute bottom-10 left-0 right-0 text-center">
         <p className="text-[7px] font-black text-white/10 uppercase tracking-[0.8em]">Secure Enterprise Core v7.0</p>
      </div>
    </div>
  );
}
