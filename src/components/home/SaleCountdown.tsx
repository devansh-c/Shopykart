'use client';

import { useState, useEffect } from 'react';
import { Timer, Zap, Trophy, ChevronRight, Stars } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Super 1000 Order Completed Sale Countdown.
 * Minimalist Redesign for Premium Feel.
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
    <div className="px-4 py-2">
      <div className="relative overflow-hidden bg-[#0A0A0A] rounded-[2rem] p-7 shadow-2xl border border-white/5 transform-gpu transition-all">
        {/* Subtle Backdrop Glow */}
        <div className="absolute top-0 right-0 h-40 w-40 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
               <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500">Event Active</span>
               </div>
               <h3 className="text-2xl font-black italic tracking-tighter text-white uppercase leading-none">
                 Super <span className="text-primary">1000</span> Sale
               </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
               <Trophy className="h-4 w-4 text-primary opacity-80" />
            </div>
          </div>

          <div className="flex items-end justify-between gap-4">
             <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Flash Sale Ends In</p>
                <div className="flex items-center gap-2 mt-2">
                   {[
                     { val: timeLeft.hours, label: 'h' },
                     { val: timeLeft.minutes, label: 'm' },
                     { val: timeLeft.seconds, label: 's' }
                   ].map((unit, i) => (
                     <div key={i} className="flex items-baseline gap-0.5">
                        <span className="text-3xl font-black text-white italic tabular-nums tracking-tighter">
                          {String(unit.val).padStart(2, '0')}
                        </span>
                        <span className="text-[8px] font-black text-primary uppercase">{unit.label}</span>
                        {i < 2 && <span className="text-white/20 mx-1 font-light">:</span>}
                     </div>
                   ))}
                </div>
             </div>

             <button 
               onClick={() => window.scrollTo({ top: 1200, behavior: 'smooth' })}
               className="h-12 px-6 bg-white text-black rounded-xl font-black uppercase italic text-[10px] tracking-widest flex items-center gap-2 active:scale-95 transition-all shadow-xl shadow-white/5"
             >
               EXPLORE
               <ChevronRight className="h-3.5 w-3.5 stroke-[3]" />
             </button>
          </div>
        </div>

        {/* Minimal Bottom Line */}
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5">
           <div className="h-full bg-primary/40 animate-running-line" />
        </div>
      </div>
    </div>
  );
}
