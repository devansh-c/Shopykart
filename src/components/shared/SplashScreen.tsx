
"use client"

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

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
      <div className="relative flex flex-col items-center">
        <div className="absolute inset-0 bg-primary/20 blur-[100px] animate-pulse rounded-full" />
        
        <div className={cn(
          "transition-all duration-1000 transform",
          isVisible ? "scale-100 opacity-100" : "scale-110 opacity-0"
        )}>
          <h1 className="text-white font-black italic text-6xl tracking-tighter text-center">
            SHOPYKART <span className="text-primary">EATS</span>
          </h1>
          <p className="text-center mt-4 text-[10px] text-white/40 font-bold uppercase tracking-[0.5em]">
            Premium Food Delivery
          </p>
        </div>
      </div>

      <div className="absolute bottom-20 w-48 h-[1px] bg-white/10 overflow-hidden">
        <div className="h-full bg-primary animate-[shimmer_2s_infinite] w-full" />
      </div>
    </div>
  );
}
