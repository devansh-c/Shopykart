'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Super 1000 Order Sale Countdown.
 * Fixed for Hydration Safety: Date calculations deferred until mount.
 */
export function SaleCountdown() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(true); // Default to expired for SSR
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const calculateTime = () => {
      const now = new Date();
      const end = new Date();
      
      // Set end time to 8:00 PM (20:00:00) today
      end.setHours(20, 0, 0, 0);

      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
      setIsExpired(false);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!mounted || isExpired) return null;

  return (
    <div className="px-4 py-4 animate-in fade-in duration-700">
      <div className="bg-[#8B0021] rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(139,0,33,0.3)] relative overflow-hidden group border-2 border-[#C5A021] transform-gpu">
        
        {/* GOLDEN SHINING GLOW */}
        <div className="absolute inset-0 bg-[#C5A021]/10 animate-pulse blur-3xl pointer-events-none" />
        <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-[#C5A021]/20 to-transparent -rotate-45 animate-[shine_4s_infinite] pointer-events-none" />

        <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none">
           <span className="text-[7px] font-black text-[#C5A021] uppercase tracking-[0.6em]">
             Super 1000 Milestone Sale
           </span>
        </div>

        <div className="relative z-10 flex items-center justify-between">
           <div className="flex-1 flex flex-col items-center">
              <span className="text-6xl font-black italic tracking-tighter text-white tabular-nums leading-none">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-black text-white/50 uppercase tracking-widest mt-4">HOURS</span>
           </div>
           <div className="h-16 w-[1.5px] bg-[#C5A021]/30" />
           <div className="flex-1 flex flex-col items-center">
              <span className="text-6xl font-black italic tracking-tighter text-white tabular-nums leading-none">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-black text-white/50 uppercase tracking-widest mt-4">MINUTES</span>
           </div>
           <div className="h-16 w-[1.5px] bg-[#C5A021]/30" />
           <div className="flex-1 flex flex-col items-center">
              <span className="text-6xl font-black italic tracking-tighter text-white tabular-nums leading-none">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-black text-[#C5A021] uppercase tracking-widest mt-4">SECONDS</span>
           </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#C5A021] to-transparent animate-running-line" />
      </div>
    </div>
  );
}
