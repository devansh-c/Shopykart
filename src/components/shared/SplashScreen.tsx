
"use client"

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2800);

    const removeTimer = setTimeout(() => {
      setShouldRender(false);
    }, 3500);

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
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="relative flex flex-col items-center">
        <div className={cn(
          "transition-all duration-1000 transform flex flex-col items-center",
          isVisible ? "scale-100 opacity-100" : "scale-110 opacity-0"
        )}>
          {/* PhonePe Style Minimalist Logo */}
          <div className="flex flex-col items-center">
            <h1 className="flex items-center text-4xl font-black italic tracking-tighter leading-none text-white">
              <span>SHOPY</span>
              <span className="text-white/40 ml-1">KART</span>
            </h1>
            <div className="mt-6 w-8 h-1 bg-white/20 rounded-full overflow-hidden">
               <div className="h-full bg-white animate-shimmer" style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      </div>
      
      <div className={cn(
        "absolute bottom-12 transition-all duration-1000 delay-300 flex flex-col items-center",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40">
          Handcrafted in India
        </p>
      </div>
    </div>
  );
}
