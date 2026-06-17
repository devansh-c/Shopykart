"use client"

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface SplashScreenProps {
  isAppReady?: boolean;
}

/**
 * @fileOverview Optimized SplashScreen with strict hydration fix.
 */
export function SplashScreen({ isAppReady = false }: SplashScreenProps) {
  const [isTimerDone, setIsTimerDone] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [taps, setTaps] = useState(0);
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    const isReturning = typeof window !== 'undefined' && localStorage.getItem('shopykart_session_active') === 'true';
    
    const duration = isReturning ? 600 : 2000;
    const timer = setTimeout(() => {
      setIsTimerDone(true);
    }, duration);
    return () => clearTimeout(timer);
  }, []);

  const isVisible = !isTimerDone || !isAppReady;

  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      
      const removeTimer = setTimeout(() => {
        setShouldRender(false);
      }, 700);
      return () => clearTimeout(removeTimer);
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isVisible]);

  const handleTap = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const nextTaps = taps + 1;
    if (nextTaps >= 5) {
      setTaps(0);
      router.push('/admin/dashboard');
    } else {
      setTaps(nextTaps);
      timerRef.current = setTimeout(() => setTaps(0), 2000);
    }
  };

  if (!shouldRender) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[50000] bg-[#0B0B0B] flex flex-col items-center justify-center transition-opacity duration-700 ease-in-out touch-none select-none h-screen w-screen",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div 
        onClick={handleTap}
        className={cn(
          "relative flex flex-col items-center transition-all duration-700 transform",
          isVisible ? "scale-100 opacity-100" : "scale-90 opacity-0"
        )}
      >
        <div className="px-10 py-6 border border-[#C5A021]/40 rounded-[3rem] bg-black/60 backdrop-blur-md shadow-[0_0_60px_rgba(197,160,33,0.2)] flex flex-col items-center">
          <h1 className="flex items-center text-4xl font-black italic tracking-tighter leading-none">
            <span className="text-white">SHOPY</span>
            <span className="text-[#C5A021]">KART</span>
          </h1>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mt-4">
            QUALITY FIRST
          </span>
        </div>
      </div>
      
      <div className={cn(
        "absolute bottom-12 flex flex-col items-center gap-2 transition-all duration-700 delay-300",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <p suppressHydrationWarning className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20">
          Handicrafted In India
        </p>
        <div className="w-20 h-0.5 bg-white/5 rounded-full overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C5A021] to-transparent animate-running-line" />
        </div>
      </div>
    </div>
  );
}
