"use client"

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // Show splash for 1.2 seconds to give a premium feel
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 1200);

    const removeTimer = setTimeout(() => {
      setShouldRender(false);
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!shouldRender) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[200] bg-[#5f259f] flex flex-col items-center justify-center transition-all duration-700 ease-in-out",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none translate-y-full"
      )}
    >
      <div className="relative flex flex-col items-center">
        <div className={cn(
          "transition-all duration-1000 transform flex flex-col items-center",
          isVisible ? "scale-100 opacity-100" : "scale-110 opacity-0"
        )}>
          {/* Minimalist White Logo */}
          <div className="flex flex-col items-center">
            <h1 className="flex items-center text-5xl font-black italic tracking-tighter leading-none text-white">
              <span>SHOPY</span>
              <span className="opacity-60 ml-0.5">KART</span>
            </h1>
            <div className="w-12 h-1 bg-white/20 mt-6 rounded-full overflow-hidden">
               <div className="h-full bg-white animate-shimmer" style={{ width: '40%' }} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Footer like PhonePe */}
      <div className={cn(
        "absolute bottom-12 transition-all duration-1000 delay-300",
        isVisible ? "opacity-40 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white">
          Made in India
        </p>
      </div>
    </div>
  );
}
