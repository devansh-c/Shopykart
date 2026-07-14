'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * @fileOverview High-end Minimalist Splash Screen.
 * Optimized: Fixed hydration issues and improved exit speed.
 */
export function SplashScreen({ isAppReady = false }: { isAppReady?: boolean }) {
  const [shouldExit, setShouldExit] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isAppReady) {
      const timer = setTimeout(() => setShouldExit(true), 200);
      return () => clearTimeout(timer);
    }
  }, [isAppReady]);

  // Prevent any rendering on server to avoid hydration mismatch
  if (!mounted || shouldExit) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-[999999] bg-black flex flex-col items-center justify-center transition-all duration-300 ease-out",
      isAppReady ? "opacity-0 pointer-events-none scale-105" : "opacity-100"
    )}>
      {/* Centered Logo Container */}
      <div className="relative flex flex-col items-center px-12 py-5 border-2 border-[#C5A021]/30 rounded-[3rem] bg-black shadow-[0_0_50px_rgba(197,160,33,0.1)]">
        <div className="flex items-center text-4xl sm:text-5xl font-black italic tracking-tighter leading-none select-none">
          <span className="text-white">SHOPY</span>
          <span className="text-[#C5A021]">KART</span>
        </div>
        
        {/* Elegant Separator Line */}
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#C5A021]/50 to-transparent mt-3 opacity-60" />
        
        {/* Slogan */}
        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.5em] text-white/40 mt-3 select-none text-center">
          QUALITY FIRST
        </span>
      </div>

      {/* Golden loading line at the very bottom */}
      <div className="absolute bottom-0 left-0 w-full h-[4px] bg-white/5 overflow-hidden">
        <div 
          className={cn(
            "h-full bg-[#C5A021] shadow-[0_0_15px_#C5A021]",
            isAppReady ? "w-full transition-all duration-300" : "w-1/3 animate-running-line"
          )} 
        />
      </div>
    </div>
  );
}
