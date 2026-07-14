'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * @fileOverview High-end Minimalist Splash Screen.
 * Optimized: Logo is stable in the center (no popup/zoom).
 * Logo size reduced as requested. SEO safe as it is client-side only.
 * Guaranteed visibility for 1.8s to ensure premium branding experience.
 */
export function SplashScreen({ isAppReady = false }: { isAppReady?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [minDurationPassed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Minimum time to show branding (1.8 seconds)
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  // Hydration safety: Don't render anything on server
  if (!mounted) return null;

  // The splash screen hides ONLY when both app is ready AND min duration has passed
  const shouldHide = isAppReady && minDurationPassed;

  return (
    <div className={cn(
      "fixed inset-0 z-[999999] bg-black flex flex-col items-center justify-center transition-all duration-1000 ease-premium transform-gpu",
      shouldHide ? "opacity-0 pointer-events-none scale-110 blur-xl" : "opacity-100"
    )}>
      {/* Main Logo Container - Stable Luxury Box */}
      <div className="relative flex flex-col items-center px-10 py-6 border-2 border-[#C5A021]/20 rounded-[2.5rem] bg-black shadow-[0_0_100px_rgba(197,160,33,0.1)] animate-in fade-in duration-1000">
        
        {/* Glowing Aura behind Logo */}
        <div className="absolute inset-0 bg-[#C5A021]/5 blur-[40px] rounded-full animate-pulse pointer-events-none" />

        <div className="relative flex items-center text-3xl sm:text-4xl font-black italic tracking-tighter leading-none select-none">
          <span className="text-white drop-shadow-lg">SHOPY</span>
          <span className="text-[#C5A021] drop-shadow-[0_0_15px_rgba(197,160,33,0.4)] ml-1">KART</span>
        </div>
        
        {/* Elegant Gold Separator */}
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#C5A021]/40 to-transparent mt-4 opacity-60" />
        
        {/* Luxury Slogan */}
        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.5em] text-white/30 mt-4 select-none text-center italic">
          QUALITY FIRST DELIVERY
        </span>
      </div>

      {/* Reflective Gloss Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent pointer-events-none" />

      {/* Bottom Loading Indicator */}
      <div className="absolute bottom-0 left-0 w-full h-[3px] bg-white/[0.03] overflow-hidden">
        <div 
          className={cn(
            "h-full bg-[#C5A021] shadow-[0_0_20px_#C5A021] transition-all duration-500 ease-out",
            shouldHide ? "w-full" : "w-1/4 animate-running-line"
          )} 
        />
      </div>

      {/* Version Tag */}
      <div className="absolute bottom-10 left-0 right-0 text-center">
         <p className="text-[7px] font-black text-white/10 uppercase tracking-[0.8em]">Secure Enterprise Core v7.2</p>
      </div>
    </div>
  );
}
