"use client"

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // Show splash for 2.5 seconds then fade out
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    // Completely remove from DOM after fade animation
    const removeTimer = setTimeout(() => {
      setShouldRender(false);
    }, 3200);

    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!shouldRender) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[100] bg-[#0B0B0B] flex flex-col items-center justify-center transition-all duration-700 ease-in-out",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="relative">
        {/* Animated Background Glow */}
        <div className="absolute inset-0 bg-primary/20 blur-[100px] animate-pulse rounded-full" />
        
        {/* Logo Container */}
        <div className={cn(
          "relative flex items-center gap-1 scale-150 transition-all duration-1000",
          isVisible ? "scale-150 translate-y-0" : "scale-[2] -translate-y-10"
        )}>
          <div className="border-[1.5px] border-[#C5A021] rounded-2xl px-6 py-3 flex items-center leading-none gap-1 bg-black/40 backdrop-blur-xl shadow-2xl">
            <span className="text-white font-black text-3xl italic tracking-tighter uppercase animate-in slide-in-from-left duration-700">Shopy</span>
            <span className="text-[#C5A021] font-black text-3xl italic tracking-tighter uppercase animate-in slide-in-from-right duration-700">kart</span>
          </div>
        </div>

        {/* Tagline */}
        <div className={cn(
          "mt-8 text-center transition-all duration-700 delay-300",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em] italic">
            Gourmet Experiences Delivered
          </p>
        </div>
      </div>

      {/* Loading Bar */}
      <div className="absolute bottom-20 w-48 h-[1px] bg-white/10 overflow-hidden">
        <div className="h-full bg-primary animate-[shimmer_2s_infinite] w-full" />
      </div>
    </div>
  );
}
