'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, ShoppingBag, Gift, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function PromoPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem('last_promo_shown');

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
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 h-10 w-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-400 hover:text-black transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative h-48 w-full">
          <Image
            src="https://picsum.photos/seed/promo/600/400"
            alt="Promotion"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
          <div className="absolute bottom-4 left-6">
            <span className="bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase italic tracking-widest shadow-lg">
              LIMITED OFFER
            </span>
          </div>
        </div>

        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/10 text-primary mb-4">
            <Gift className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black italic uppercase tracking-tight text-gray-800 leading-tight mb-2">
            FREE DELIVERY<br />ON FIRST ORDER
          </h2>
          <p className="text-xs text-muted-foreground font-medium mb-8">
            Order anything from your favorite local stores and get it delivered for free today!
          </p>

          <Button
            onClick={handleClose}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase italic shadow-xl shadow-primary/20 active:scale-95 transition-all"
          >
            CLAIM NOW
          </Button>
          
          <p className="mt-4 text-[9px] text-gray-400 font-bold uppercase tracking-widest italic">
            * Valid for new users in Ranipur & Mauranipur
          </p>
        </div>
      </div>
    </div>
  );
}
