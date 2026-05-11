"use client"

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 800);

    const removeTimer = setTimeout(() => {
      setShouldRender(false);
    }, 1300);

    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!shouldRender) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center transition-all duration-500 ease-in-out",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="relative flex flex-col items-center">
        {/* Subtle Light Glow */}
        <div className="absolute inset-0 bg-primary/5 blur-[100px] animate-pulse rounded-full" />
        
        <div className={cn(
          "transition-all duration-700 transform flex flex-col items-center",
          isVisible ? "scale-100 opacity-100" : "scale-105 opacity-0"
        )}>
          <div className="px-8 py-4 border border-border rounded-[2rem] bg-white/80 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.03)] flex flex-col items-center">
            <h1 className="flex items-center text-3xl font-black italic tracking-tighter leading-none text-center">
              <span className="text-foreground">SHOPY</span>
              <span className="text-primary">KART</span>
            </h1>
            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground mt-2">
              QUALITY FIRST
            </span>
          </div>
          <p className="text-center mt-6 text-[8px] text-primary font-black uppercase tracking-[0.3em] opacity-70">
            Premium Food Delivery
          </p>
        </div>
      </div>

      <div className="absolute bottom-20 w-32 h-[2px] bg-muted overflow-hidden rounded-full">
        <div className="h-full bg-primary animate-[shimmer_2s_infinite] w-full" />
      </div>
    </div>
  );
}
