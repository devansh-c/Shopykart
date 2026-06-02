"use client"

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);
  const [taps, setTaps] = useState(0);
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Keep visible for exactly 2 seconds as requested
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    // Optimized fade out - fast and clean
    const removeTimer = setTimeout(() => {
      setShouldRender(false);
    }, 2200);

    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, []);

  const handleTap = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const nextTaps = taps + 1;
    
    if (nextTaps >= 5) {
      setTaps(0);
      router.push('/admin/dashboard');
    } else {
      setTaps(nextTaps);
      timerRef.current = setTimeout(() => {
        setTaps(0);
      }, 2000);
    }
  };

  if (!shouldRender) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[500] bg-[#0B0B0B] flex flex-col items-center justify-center transition-all duration-300 ease-in-out",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none translate-y-2"
      )}
    >
      <div className="relative flex flex-col items-center">
        <div 
          onClick={handleTap}
          className={cn(
            "transition-all duration-300 transform flex flex-col items-center cursor-pointer active:scale-95",
            isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
          )}
        >
          {/* Pill-shaped Branding */}
          <div className="px-10 py-5 border border-[#C5A021]/40 rounded-[3rem] bg-black/60 backdrop-blur-md shadow-[0_0_40px_rgba(197,160,33,0.2)] flex flex-col items-center">
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
      
      {/* Handcrafted Detail */}
      <div className={cn(
        "absolute bottom-12 transition-all duration-500 delay-100 flex flex-col items-center gap-2",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20">Handcrafted By Devansh</p>
        <div className="w-24 h-0.5 bg-white/5 rounded-full overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C5A021] to-transparent animate-running-line" />
        </div>
      </div>
    </div>
  );
}
