'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * @fileOverview PromoPopup handles the fullscreen daily promotional banner.
 * It uses localStorage to ensure it only appears once per day per user.
 */
export function PromoPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if promo was already shown today
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem('last_promo_shown');

    if (lastShown !== today) {
      // Delay popup slightly for a smoother app entry experience
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    // Save to localStorage so it doesn't show again today
    localStorage.setItem('last_promo_shown', new Date().toDateString());
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-500">
      <div className="relative w-full max-w-[400px] bg-white rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-700">
        {/* Floating Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 h-10 w-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors active:scale-90"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Video / Banner Content */}
        <div className="relative aspect-square w-full bg-muted">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover"
          >
            <source src="https://assets.mixkit.co/videos/preview/mixkit-top-view-of-a-creamy-ice-cream-in-a-glass-32630-large.mp4" type="video/mp4" />
          </video>

          {/* Text Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8">
            <div className="bg-amber-400 text-black text-[10px] font-black px-3 py-1 rounded-full w-fit mb-3 uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
              <Sparkles className="h-3 w-3 fill-black" />
              Limited Time Selection
            </div>
            <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">
              FREE SCOOP<br /><span className="text-primary">ON US!</span>
            </h2>
            <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest mt-2">
              Valid on all orders above ₹399
            </p>
          </div>
        </div>

        {/* Action Area */}
        <div className="p-8 bg-white">
          <Button
            onClick={handleClose}
            className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase italic text-xl shadow-xl shadow-red-200 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            Claim Free Ice Cream
          </Button>
          <p className="text-center text-[9px] text-muted-foreground font-black mt-5 uppercase tracking-[0.3em] opacity-40">
            Tap to activate offer automatically
          </p>
        </div>
      </div>
    </div>
  );
}
