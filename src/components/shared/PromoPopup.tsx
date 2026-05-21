'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Sparkles, Gift, Zap, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function PromoPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // Countdown Logic: Reset every day or set to a specific time
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      
      const diff = endOfDay.getTime() - now.getTime();
      
      if (diff > 0) {
        setTimeLeft({
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem('last_promo_shown');

    // Show popup after 2 seconds if not shown today
    if (lastShown !== today) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('last_promo_shown', new Date().toDateString());
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="relative w-full max-w-sm bg-[#0A0A0B] rounded-[3.5rem] overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(239,68,68,0.25)] animate-in zoom-in-95 duration-500">
        
        {/* Animated Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[40%] bg-gradient-to-b from-primary/30 via-primary/5 to-transparent rounded-full blur-[60px] opacity-50" />
        
        {/* Top Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 z-50 h-10 w-10 bg-white/5 backdrop-blur-md rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-all border border-white/10 active:scale-90"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content Container */}
        <div className="relative flex flex-col items-center pt-12 pb-10 px-8">
          
          {/* Urgency Badge */}
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full mb-6 animate-pulse">
            <Zap className="h-3 w-3 text-primary fill-primary" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">Only Today</span>
          </div>

          {/* Main Graphic Section */}
          <div className="relative w-full h-56 mb-8 group">
            {/* Floating Ice Cream Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/20 rounded-full blur-[40px] group-hover:scale-110 transition-transform duration-700" />
            
            <div className="relative z-10 w-full h-full flex items-center justify-center">
               <Image
                src="https://picsum.photos/seed/icecream-scoop/500/500"
                alt="Free Ice Cream"
                width={220}
                height={220}
                className="object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)] transform group-hover:-rotate-6 group-hover:scale-105 transition-all duration-700"
                data-ai-hint="ice cream"
              />
              {/* Decorative Stars */}
              <Star className="absolute top-4 right-10 h-6 w-6 text-amber-400 fill-amber-400 animate-bounce delay-100" />
              <Star className="absolute bottom-10 left-8 h-4 w-4 text-amber-200 fill-amber-200 animate-pulse delay-300" />
            </div>
          </div>

          {/* Typography Section */}
          <div className="text-center space-y-2 mb-8">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">ShopyKart Special</h3>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-[0.85]">
              FREE<br />
              <span className="text-primary drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">ICE CREAM</span>
            </h2>
            <p className="text-xs text-gray-400 font-medium px-4 pt-2">
              Valid on all orders above ₹299 from our Premium Stores.
            </p>
          </div>

          {/* Real-time Countdown */}
          <div className="w-full flex items-center justify-center gap-3 mb-8">
            <div className="flex flex-col items-center bg-white/5 border border-white/5 w-14 py-2 rounded-2xl">
              <span className="text-lg font-black text-white italic">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Hrs</span>
            </div>
            <span className="text-white font-black animate-pulse">:</span>
            <div className="flex flex-col items-center bg-white/5 border border-white/5 w-14 py-2 rounded-2xl">
              <span className="text-lg font-black text-white italic">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Min</span>
            </div>
            <span className="text-white font-black animate-pulse">:</span>
            <div className="flex flex-col items-center bg-white/5 border border-white/5 w-14 py-2 rounded-2xl">
              <span className="text-lg font-black text-white italic">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Sec</span>
            </div>
          </div>

          {/* Glowing CTA Button */}
          <div className="w-full relative group">
            <div className="absolute inset-0 bg-primary blur-[20px] opacity-20 group-hover:opacity-40 transition-opacity" />
            <Button
              onClick={handleClose}
              className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-[2rem] font-black uppercase italic text-lg shadow-[0_10px_30px_rgba(239,68,68,0.3)] active:scale-95 transition-all border-b-4 border-black/20 relative z-10"
            >
              <Gift className="h-5 w-5 mr-2" />
              CLAIM FREE TREAT
            </Button>
          </div>

          <p className="mt-6 text-[8px] text-gray-600 font-black uppercase tracking-[0.3em]">
            Guaranteed Fast Delivery • ShopyKart
          </p>
        </div>
      </div>
    </div>
  );
}
