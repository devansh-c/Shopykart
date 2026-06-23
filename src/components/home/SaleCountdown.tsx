'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Super 1000 Order Milestone Celebration.
 * Ultra-minimalist boutique design for a high-end premium feel.
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
    <div className="px-4 py-3">
      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.03)] flex items-center justify-between transform-gpu transition-all hover:shadow-[0_15px_50px_rgba(0,0,0,0.06)] group">
        
        {/* Left Side: Milestone Branding */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
             <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
             <span className="text-[8px] font-black uppercase tracking-[0.4em] text-red-500 leading-none">Milestone Celebration</span>
          </div>
          <div className="space-y-0">
            <h3 className="text-2xl font-black italic tracking-tighter text-gray-900 uppercase leading-none">
              Super <span className="text-red-500">1000</span> Sale
            </h3>
            <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-1">Limited window offer • Tonight 8PM</p>
          </div>
        </div>

        {/* Right Side: Elegant Ticker */}
        <div className="flex items-center gap-5">
           <div className="flex gap-3">
              {[
                { val: timeLeft.hours, label: 'HR' },
                { val: timeLeft.minutes, label: 'MIN' },
                { val: timeLeft.seconds, label: 'SEC' }
              ].map((unit, i) => (
                <div key={i} className="flex flex-col items-center">
                   <span className="text-2xl font-black italic tabular-nums tracking-tighter text-gray-900 leading-none">
                     {String(unit.val).padStart(2, '0')}
                   </span>
                   <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest mt-1.5">{unit.label}</span>
                </div>
              ))}
           </div>

           <button 
             onClick={() => window.scrollTo({ top: 1100, behavior: 'smooth' })}
             className="h-11 w-11 bg-[#0B0B0B] text-white rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all group-hover:bg-red-500"
           >
             <ChevronRight className="h-5 w-5 stroke-[3]" />
           </button>
        </div>
      </div>
    </div>
  );
}
