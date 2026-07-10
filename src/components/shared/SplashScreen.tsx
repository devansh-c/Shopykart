
"use client"

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface SplashScreenProps {
  isAppReady?: boolean;
}

/**
 * @fileOverview Minimalist Splash Screen.
 * Shows only the Shopykart logo for exactly 2 seconds.
 * Style updated to match user provided image with reduced vertical height.
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
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
      )}
    >
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-20%] right-[-20%] w-full h-full bg-primary/5 blur-[120px] rounded-full animate-pulse" />
      </div>

      <div 
        onClick={handleTap}
        className="relative flex flex-col items-center transition-all duration-700 transform px-6"
      >
        {/* Pill Shaped Logo Container matching user image with reduced vertical padding */}
        <div className="px-12 py-5 border-2 border-[#C5A021]/40 rounded-full bg-black shadow-[0_0_60px_rgba(197,160,33,0.15)] flex flex-col items-center animate-in fade-in duration-1000 min-w-[280px]">
          <h1 className="flex items-center text-4xl font-black italic tracking-tighter leading-none">
            <span className="text-white">SHOPY</span>
            <span className="text-[#C5A021]">KART</span>
          </h1>
          <div className="w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#C5A021]/60 to-transparent mt-3 opacity-50" />
          <span className="text-[9px] font-black uppercase tracking-[0.5em] text-white/40 mt-3">
            QUALITY FIRST
          </span>
        </div>
      </div>

      {/* Footer Signature - Updated to White, Non-Italic with Shine */}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
         <div className="relative overflow-hidden px-4">
            <p className="text-[9px] font-black text-white uppercase tracking-[0.4em] relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
               Handicrafted by Devansh
            </p>
            {/* Shine Sweep Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shine pointer-events-none" />
         </div>
      </div>
    </div>
  );
}
