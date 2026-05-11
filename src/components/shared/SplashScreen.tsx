
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
        "fixed inset-0 z-[200] bg-[#5f259f] flex flex-col items-center justify-center transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1)",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none scale-110"
      )}
    >
      <div className="relative flex flex-col items-center">
        <div className={cn(
          "transition-all duration-1000 transform flex flex-col items-center",
          isVisible ? "scale-100 opacity-100" : "scale-150 opacity-0"
        )}>
          {/* Minimalist Logo for Splash */}
          <div className="flex flex-col items-center">
            <h1 className="flex items-center text-5xl font-black italic tracking-tighter leading-none text-white">
              <span>SHOPY</span>
              <span className="text-[#fdbb12] ml-1">KART</span>
            </h1>
            <div className="w-16 h-0.5 bg-white/20 mt-10 rounded-full overflow-hidden">
               <div className="h-full bg-white/60 animate-pulse" style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      </div>
      
      <div className={cn(
        "absolute bottom-16 transition-all duration-1000 delay-500 flex flex-col items-center",
        isVisible ? "opacity-60 translate-y-0" : "opacity-0 translate-y-8"
      )}>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/80">
          Handcrafted in India
        </p>
      </div>
    </div>
  );
}
