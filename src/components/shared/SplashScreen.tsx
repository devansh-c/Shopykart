
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
        {/* Golden Glow */}
        <div className="absolute inset-0 bg-[#C5A021]/15 blur-[120px] animate-pulse rounded-full" />
        
        <div className={cn(
          "transition-all duration-1000 transform flex flex-col items-center",
          isVisible ? "scale-100 opacity-100" : "scale-110 opacity-0"
        )}>
          <div className="px-10 py-4 border-2 border-[#C5A021]/30 rounded-[2.5rem] bg-black/40 backdrop-blur-md shadow-[0_0_50px_rgba(197,160,33,0.15)]">
            <h1 className="text-white font-black italic text-5xl tracking-tighter text-center">
              SHOPYKART <span className="text-primary">EATS</span>
            </h1>
          </div>
          <p className="text-center mt-6 text-[10px] text-[#C5A021] font-black uppercase tracking-[0.5em] opacity-80">
            Premium Food Delivery
          </p>
        </div>
      </div>

      <div className="absolute bottom-20 w-48 h-[1px] bg-white/5 overflow-hidden">
        <div className="h-full bg-[#C5A021] animate-[shimmer_2s_infinite] w-full" />
      </div>
    </div>
  );
}
