
'use client';

import { useEffect, useState } from 'react';
import { Coins, Sparkles, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Shows a 2-second welcome bonus animation for new registrations.
 */
export default function WelcomeBonusOverlay() {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasBonusFlag = localStorage.getItem('show_welcome_bonus');
    
    if (hasBonusFlag === 'true') {
      const timer = setTimeout(() => {
        setIsVisible(true);
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
          audio.volume = 0.5;
          audio.play().catch(() => {});
        } catch (e) {}

        setTimeout(() => {
          setIsVisible(false);
          localStorage.removeItem('show_welcome_bonus');
        }, 2000);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, []);

  if (!mounted || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm bg-white rounded-[3rem] p-10 flex flex-col items-center text-center shadow-2xl animate-in zoom-in duration-500 transform">
        <div className="absolute inset-0 overflow-hidden rounded-[3rem] pointer-events-none">
           <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-400/10 blur-3xl animate-pulse" />
           <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-3xl animate-pulse delay-500" />
        </div>
        <div className="relative mb-8">
           <div className="absolute inset-0 bg-amber-100 rounded-full animate-ping opacity-40 scale-150" />
           <div className="relative bg-gradient-to-br from-amber-400 to-orange-600 h-24 w-24 rounded-full flex items-center justify-center shadow-xl shadow-amber-200 border-4 border-white">
              <Coins className="h-12 w-12 text-white fill-white/20" />
           </div>
           <Sparkles className="absolute -top-4 -right-4 h-8 w-8 text-amber-500 animate-bounce" />
           <Star className="absolute -bottom-2 -left-4 h-6 w-6 text-orange-500 animate-pulse" />
        </div>
        <div className="space-y-4 relative z-10">
          <h2 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900 leading-[0.85]">
            YAY! <br /><span className="text-amber-600">REWARDED.</span>
          </h2>
          <div className="bg-amber-50 px-6 py-4 rounded-[1.5rem] border border-amber-100 inline-block">
             <p className="text-base font-black italic text-amber-700 leading-tight">
               You get 10 coins welcome bonus on ShopyKart!
             </p>
          </div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] leading-relaxed max-w-[220px] mx-auto mt-2">
            START SHOPPING AND REDEEM THEM ON YOUR FIRST ORDER.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gray-100 overflow-hidden rounded-b-[3rem]">
           <div className="h-full bg-amber-500 animate-[running-line_2s_linear]" style={{ width: '100%' }} />
        </div>
      </div>
    </div>
  );
}
