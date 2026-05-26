'use client';

import { useState, useEffect } from 'react';
import { ThermometerSun, AlertTriangle, Clock, ShieldAlert, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Emergency overlay for extreme heat (48°C).
 * Updated: Active between 13:00 (1 PM) and 15:00 (3 PM).
 */
export function HeatWaveOverlay() {
  const [isActive, setIsActive] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkTime = () => {
      const now = new Date();
      const hours = now.getHours();
      
      // NEW TIMING: Active between 1:00 PM (13) and 3:00 PM (15)
      if (hours >= 13 && hours < 15) {
        setIsActive(true);
      } else {
        setIsActive(false);
      }
    };

    // Run check immediately on mount
    checkTime();
    
    // Continue checking every minute to auto-resume at 3 PM
    const interval = setInterval(checkTime, 60000); 
    return () => clearInterval(interval);
  }, []);

  if (!mounted || !isActive) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-[#0B0B0B] flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* Background Heat Animation */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-600 via-transparent to-transparent animate-pulse" />
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center space-y-10 animate-in fade-in zoom-in duration-700">
        
        {/* Visual Identity */}
        <div className="relative">
          <div className="absolute inset-0 bg-orange-600/20 blur-3xl rounded-full animate-ping" />
          <div className="relative h-32 w-32 rounded-[3rem] bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-[0_20px_50px_rgba(234,88,12,0.3)] border-4 border-white/10">
            <ThermometerSun className="h-16 w-16 text-white animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
          
          <div className="absolute -top-4 -right-4 bg-white text-red-600 p-3 rounded-2xl shadow-2xl font-black italic text-xl border-2 border-red-50">
            48°C
          </div>
        </div>

        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-1.5 rounded-full shadow-lg animate-pulse">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Heat Wave Emergency</span>
          </div>
          
          <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-[0.9]">
            DELIVERY<br /><span className="text-orange-500">PAUSED.</span>
          </h1>
          
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] leading-relaxed max-w-[280px] mx-auto mt-4">
            EXTREME TEMPERATURE DETECTED. FOR THE SAFETY OF OUR DELIVERY PARTNERS, SERVICES ARE TEMPORARILY SUSPENDED.
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 gap-4 w-full pt-6">
           <div className="bg-white/5 backdrop-blur-md p-5 rounded-[2.5rem] border border-white/10 flex items-center gap-4 text-left">
              <div className="bg-orange-500/20 p-3 rounded-2xl text-orange-500">
                 <Clock className="h-6 w-6" />
              </div>
              <div>
                 <h4 className="text-xs font-black uppercase text-white">Resuming Soon</h4>
                 <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">At 3:00 PM IST Today</p>
              </div>
           </div>

           <div className="bg-white/5 backdrop-blur-md p-5 rounded-[2.5rem] border border-white/10 flex items-center gap-4 text-left">
              <div className="bg-blue-500/20 p-3 rounded-2xl text-blue-400">
                 <Wind className="h-6 w-6" />
              </div>
              <div>
                 <h4 className="text-xs font-black uppercase text-white">Stay Hydrated</h4>
                 <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Drink water & stay indoors</p>
              </div>
           </div>
        </div>

        <div className="pt-10 opacity-30 flex flex-col items-center gap-2">
           <ShieldAlert className="h-5 w-5 text-white" />
           <p className="text-[8px] font-black uppercase tracking-[0.5em] text-white">ShopyKart Safety Protocol</p>
        </div>
      </div>

      {/* Decorative heat lines */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-shimmer" />
    </div>
  );
}
