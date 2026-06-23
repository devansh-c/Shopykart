'use client';

import { useState, useEffect } from 'react';
import { Timer, Zap, Trophy, ChevronRight, Stars } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Super 1000 Order Completed Sale Countdown.
 * Ends at 8:00 PM (20:00) today.
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
      
      // Set end time to 8:00 PM (20:00:00)
      end.setHours(20, 0, 0, 0);

      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours: h, minutes: m, seconds: s });
      setIsExpired(false);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!mounted || isExpired) return null;

  return (
    <div className="px-4 py-3">
      <div className="relative overflow-hidden bg-[#0B0B0B] rounded-[2.5rem] p-6 shadow-2xl border border-white/5 group transform-gpu">
        {/* Animated Background Pulse */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-50 animate-pulse" />
        <div className="absolute top-0 right-0 h-full w-40 bg-white/5 -skew-x-12 translate-x-20 transition-transform duration-1000 group-hover:translate-x-10" />

        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30 rotate-[-5deg] group-hover:rotate-0 transition-transform">
                  <Trophy className="h-6 w-6" />
               </div>
               <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] animate-pulse">Live Event</span>
                    <div className="h-1 w-1 bg-primary rounded-full animate-ping" />
                  </div>
                  <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">Super 1000 Sale</h3>
               </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
               <Stars className="h-3 w-3 text-amber-400 fill-amber-400" />
               <span className="text-[8px] font-black text-white uppercase tracking-widest">Limited Access</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
             <div className="flex-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed max-w-[180px]">
                  BIGGEST CELEBRATION! SPECIAL PRICES DISAPPEARING AT <span className="text-white font-black italic">8:00 PM</span> SHARP.
                </p>
             </div>

             <div className="flex items-center gap-1.5">
                {[
                  { val: timeLeft.hours, label: 'HRS' },
                  { val: timeLeft.minutes, label: 'MIN' },
                  { val: timeLeft.seconds, label: 'SEC' }
                ].map((unit, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="bg-white/5 border border-white/10 rounded-xl w-11 h-12 flex items-center justify-center shadow-inner">
                       <span className="text-lg font-black text-white italic tabular-nums">
                         {String(unit.val).padStart(2, '0')}
                       </span>
                    </div>
                    <span className="text-[6px] font-black text-gray-500 uppercase mt-1 tracking-widest">{unit.label}</span>
                  </div>
                ))}
             </div>
          </div>

          <button 
            onClick={() => window.scrollTo({ top: 1000, behavior: 'smooth' })}
            className="w-full h-12 bg-white text-black rounded-2xl font-black uppercase italic text-[11px] tracking-[0.1em] flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
          >
            <Zap className="h-3.5 w-3.5 fill-primary text-primary" />
            GRAB DEALS NOW
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Running Progress Bar */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5 overflow-hidden">
           <div className="h-full bg-primary animate-running-line" />
        </div>
      </div>
    </div>
  );
}
