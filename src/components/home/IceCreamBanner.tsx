
'use client';

import { useState, useEffect } from 'react';
import { Gift, Timer, Zap, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function IceCreamBanner() {
  const [timeLeft, setTimeLeft] = useState({ hours: 12, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Logic for a rolling 12-hour countdown
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.hours === 0 && prev.minutes === 0 && prev.seconds === 0) {
          return { hours: 12, minutes: 0, seconds: 0 };
        }
        
        let s = prev.seconds - 1;
        let m = prev.minutes;
        let h = prev.hours;

        if (s < 0) {
          s = 59;
          m -= 1;
        }
        if (m < 0) {
          m = 59;
          h -= 1;
        }

        return { hours: h, minutes: m, seconds: s };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="px-4 py-2">
      <div className="relative overflow-hidden bg-gradient-to-r from-primary to-accent rounded-[2rem] p-4 shadow-xl shadow-primary/20 border border-white/10 group">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 h-full w-32 bg-white/10 -skew-x-12 translate-x-10" />
        <div className="absolute -bottom-4 -left-4 h-12 w-12 bg-black/10 rounded-full blur-xl" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="h-12 w-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 animate-bounce">
                <span className="text-2xl">🍦</span>
             </div>
             <div>
                <h3 className="text-sm font-black text-white italic uppercase tracking-tighter leading-none">Get Your Free Ice Cream</h3>
                <div className="flex items-center gap-1.5 mt-1">
                   <div className="bg-black/20 px-2 py-0.5 rounded-lg flex items-center gap-1 border border-white/5">
                      <Timer className="h-2.5 w-2.5 text-white/80" />
                      <span className="text-[10px] font-black text-white/90 tabular-nums">
                        {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                      </span>
                   </div>
                   <span className="text-[8px] font-bold text-white/60 uppercase tracking-widest italic">Ends Soon</span>
                </div>
             </div>
          </div>

          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-promo-popup'))}
            className="bg-white text-primary px-4 h-10 rounded-xl font-black uppercase italic text-[10px] tracking-widest flex items-center gap-1 shadow-lg active:scale-95 transition-all"
          >
            CLAIM NOW
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        
        {/* Subtle running line at bottom */}
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white/5 overflow-hidden">
           <div className="h-full w-1/3 bg-white/20 animate-running-line" />
        </div>
      </div>
    </div>
  );
}
