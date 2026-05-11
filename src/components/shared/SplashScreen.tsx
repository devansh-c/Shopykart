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
        "fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center transition-all duration-700 ease-in-out",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="relative flex flex-col items-center">
        <div className={cn(
          "transition-all duration-1000 transform flex flex-col items-center",
          isVisible ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"
        )}>
          <div className="flex flex-col items-center">
            <h1 className="flex items-center text-4xl font-black italic tracking-tighter leading-none text-center">
              <span className="text-foreground">SHOPY</span>
              <span className="text-primary">KART</span>
            </h1>
            <div className="w-12 h-[1px] bg-primary mt-4 opacity-30" />
            <span className="text-[9px] font-bold uppercase tracking-[0.5em] text-muted-foreground mt-4">
              Premium Dining
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
