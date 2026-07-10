"use client"

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface SplashScreenProps {
  isAppReady?: boolean;
}

/**
 * @fileOverview Standardized Splash Screen with Devansh Signature.
 * Duration: Exactly 2 seconds.
 */
export function SplashScreen({ isAppReady = false }: SplashScreenProps) {
  const [shouldRender, setShouldRender] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [taps, setTaps] = useState(0);
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Force the splash screen to stay for exactly 2 seconds
    const splashTimer = setTimeout(() => {
      setIsVisible(false);
      // Wait for fade animation to complete before removing from DOM
      setTimeout(() => setShouldRender(false), 500);
    }, 2000);

    return () => clearTimeout(splashTimer);
  }, []);

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
        "fixed inset-0 z-[50000] bg-[#0B0B0B] flex flex-col items-center justify-center transition-all duration-500 ease-in-out h-screen w-screen",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-110 pointer-events-none"
      )}
    >
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-20%] right-[-20%] w-full h-full bg-primary/5 blur-[120px] rounded-full animate-pulse" />
      </div>

      <div 
        onClick={handleTap}
        className="relative flex flex-col items-center transition-all duration-700 transform"
      >
        <div className="px-12 py-10 border border-[#C5A021]/30 rounded-[3rem] bg-black/40 backdrop-blur-xl shadow-[0_0_80px_rgba(197,160,33,0.15)] flex flex-col items-center animate-in zoom-in duration-700">
          <h1 className="flex items-center text-5xl font-black italic tracking-tighter leading-none">
            <span className="text-white">SHOPY</span>
            <span className="text-[#C5A021]">KART</span>
          </h1>
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#C5A021]/40 to-transparent mt-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mt-4">
            QUALITY FIRST
          </span>
        </div>
      </div>
      
      <div className="absolute bottom-16 flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
           <div className="flex items-center gap-2">
              <div className="h-1 w-1 bg-primary rounded-full animate-ping" />
              <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20">
                INITIALIZING HUB
              </p>
           </div>
           <div className="w-32 h-0.5 bg-white/5 rounded-full overflow-hidden relative">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C5A021] to-transparent animate-running-line" />
           </div>
        </div>

        <div className="flex flex-col items-center gap-1 opacity-40">
           <p className="text-[7px] font-black text-gray-500 uppercase tracking-[0.3em]">Handicrafted by</p>
           <p className="text-[10px] font-black italic text-white tracking-widest uppercase">DEVANSH</p>
        </div>
      </div>
    </div>
  );
}
