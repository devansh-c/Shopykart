'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Super 1000 Order Sale Countdown.
 * Updated: Added Golden Border and Shining background animation.
 */
export function SaleCountdown() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);
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
        
        {/* GOLDEN SHINING GLOW (BEHIND CONTENT) */}
        <div className="absolute inset-0 bg-[#C5A021]/10 animate-pulse blur-3xl pointer-events-none" />
        <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-[#C5A021]/20 to-transparent -rotate-45 animate-[shine_4s_infinite] pointer-events-none" />

        {/* Subtle Inner Glow Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent pointer-events-none" />
        
        {/* Top Content Label */}
        <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none">
           <span className="text-[7px] font-black text-[#C5A021] uppercase tracking-[0.6em]">
             Super 1000 Milestone Sale
           </span>
        </div>

        <div className="relative z-10 flex items-center justify-between">
           
           {/* HOURS SECTION */}
           <div className="flex-1 flex flex-col items-center">
              <span className="text-6xl font-black italic tracking-tighter text-white tabular-nums leading-none">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.3em] mt-4">HOURS</span>
           </div>

           {/* VERTICAL DIVIDER */}
           <div className="h-16 w-[1.5px] bg-[#C5A021]/30" />

           {/* MINUTES SECTION */}
           <div className="flex-1 flex flex-col items-center">
              <span className="text-6xl font-black italic tracking-tighter text-white tabular-nums leading-none">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.3em] mt-4">MINUTES</span>
           </div>

           {/* VERTICAL DIVIDER */}
           <div className="h-16 w-[1.5px] bg-[#C5A021]/30" />

           {/* SECONDS SECTION */}
           <div className="flex-1 flex flex-col items-center">
              <div className="relative flex flex-col items-center">
                 {/* Rolling ghost digit */}
                 <div className="absolute -top-3 opacity-20 filter blur-[1px]">
                   <span className="text-4xl font-black italic text-white/40 tabular-nums">
                     {String((timeLeft.seconds + 1) % 60).padStart(2, '0')}
                   </span>
                 </div>
                 <span className="text-6xl font-black italic tracking-tighter text-white tabular-nums leading-none relative z-10">
                   {String(timeLeft.seconds).padStart(2, '0')}
                 </span>
              </div>
              <span className="text-[9px] font-black text-[#C5A021] uppercase tracking-[0.3em] mt-4">SECONDS</span>
           </div>

        </div>

        {/* Glossy Overlay Shine */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent h-1/2 pointer-events-none" />
        
        {/* GOLDEN BORDER SHINE ANIMATION */}
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#C5A021] to-transparent animate-running-line" />
      </div>
    </div>
  );
}
