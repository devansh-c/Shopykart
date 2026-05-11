
"use client"

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // Show splash for 2.5 seconds as requested
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    // Completely remove from DOM after fade animation
    const removeTimer = setTimeout(() => {
      setShouldRender(false);
    }, 3300);

    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!shouldRender) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[200] bg-[#0B0B0B] flex flex-col items-center justify-center transition-all duration-1000 ease-in-out",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="relative flex flex-col items-center">
        <div className={cn(
          "transition-all duration-1000 transform flex flex-col items-center",
          isVisible ? "scale-100 opacity-100" : "scale-90 opacity-0"
        )}>
          {/* Screenshot Style Capsule Logo */}
          <div className="px-10 py-5 border border-[#C5A021]/40 rounded-[3rem] bg-black/60 backdrop-blur-sm shadow-[0_0_30px_rgba(197,160,33,0.15)] flex flex-col items-center">
            <h1 className="flex items-center text-4xl font-black italic tracking-tighter leading-none">
              <span className="text-white">SHOPY</span>
              <span className="text-[#C5A021]">KART</span>
            </h1>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mt-4">
              QUALITY FIRST
            </span>
          </div>
        </div>
      </div>
      
      {/* Subtle bottom detail */}
      <div className={cn(
        "absolute bottom-12 transition-all duration-1000 delay-500",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-[#C5A021]/30 to-transparent" />
      </div>
    </div>
  );
}
