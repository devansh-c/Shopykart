
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
        "fixed inset-0 z-[100] bg-primary flex flex-col items-center justify-center transition-all duration-700 ease-in-out",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="relative flex flex-col items-center">
        {/* Animated Background Glow */}
        <div className="absolute inset-0 bg-white/10 blur-[100px] animate-pulse rounded-full" />
        
        {/* Utensils Circle Icon */}
        <div className={cn(
          "h-24 w-24 bg-primary rounded-full flex items-center justify-center border-4 border-white/20 shadow-2xl relative overflow-hidden transition-all duration-1000",
          isVisible ? "scale-100 translate-y-0" : "scale-150 -translate-y-10"
        )}>
            <div className="bg-[#E5D5C0] h-16 w-16 rounded-full flex items-center justify-center border-[2px] border-black/10">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                    <path d="M7 3V11M7 11C7 12.1046 7.89543 13 9 13V15C9 15.5523 8.55228 16 8 16H6C5.44772 16 5 15.5523 5 15V13C6.10457 13 7 12.1046 7 11ZM7 3C5.89543 3 5 3.89543 5 5V9M7 3C8.10457 3 9 3.89543 9 5V9M17 3V21M17 3C18.1046 3 19 3.89543 19 5V11C19 12.1046 18.1046 13 17 13M17 3C15.8954 3 15 3.89543 15 5V11C15 12.1046 15.8954 13 17 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
        </div>

        {/* Logo Text Container */}
        <div className={cn(
          "mt-6 flex flex-col items-start leading-none transition-all duration-1000",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        )}>
          <div className="flex items-baseline">
            <span className="text-white font-medium text-5xl tracking-tighter lowercase">shopykart</span>
            <span className="text-white font-bold text-xs ml-1 align-top uppercase">TM</span>
          </div>
          <div className="w-full flex justify-end -mt-2">
            <span className="text-white font-bold text-2xl tracking-widest italic" style={{ fontFamily: "'Dancing Script', cursive" }}>---eats---</span>
          </div>
        </div>

        {/* Tagline */}
        <div className={cn(
          "mt-12 text-center transition-all duration-700 delay-300",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <p className="text-[10px] text-white/60 font-bold uppercase tracking-[0.4em]">
            Gourmet Experiences Delivered
          </p>
        </div>
      </div>

      {/* Loading Bar */}
      <div className="absolute bottom-20 w-48 h-[1px] bg-white/20 overflow-hidden">
        <div className="h-full bg-white animate-[shimmer_2s_infinite] w-full" />
      </div>
    </div>
  );
}
