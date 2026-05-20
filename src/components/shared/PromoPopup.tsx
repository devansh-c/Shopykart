'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, ShoppingBag, Utensils, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';

/**
 * @fileOverview PromoPopup redesigned to match the "CRAVE ATHON" visual style.
 */
export function PromoPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem('last_promo_shown');

    if (lastShown !== today) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('last_promo_shown', new Date().toDateString());
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="relative w-full max-w-[420px] bg-[#3F0000] rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.3)] animate-in zoom-in-95 slide-in-from-bottom-10 duration-700 flex flex-col items-center pt-10 pb-8 px-6">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 h-8 w-8 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors active:scale-90"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Crave Athon Header */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="flex items-center gap-3">
             <h2 className="text-5xl font-black italic tracking-tighter text-[#FF4D00]">CRAVE</h2>
             <div className="bg-[#FF4D00] p-1.5 rounded-full border-2 border-white shadow-lg animate-bounce">
                <Utensils className="h-6 w-6 text-white" />
             </div>
             <h2 className="text-5xl font-black italic tracking-tighter text-[#FF4D00]">ATHON</h2>
          </div>
          <div className="px-6 py-1 bg-black/40 rounded-full border border-[#FF4D00]/30 shadow-inner">
             <span className="text-[10px] font-black uppercase text-white italic tracking-[0.2em]">ORDER NOW</span>
          </div>
        </div>

        {/* Sub Header */}
        <div className="flex items-center gap-3 w-full mb-8">
           <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/20" />
           <p className="text-[11px] font-black text-white italic uppercase tracking-widest text-center whitespace-nowrap">
             FLAT ₹200 OFF & MORE
           </p>
           <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/20" />
        </div>

        {/* Deals Grid */}
        <div className="flex overflow-x-auto gap-4 w-full no-scrollbar pb-2 px-1 mb-8">
           {/* Deal 1 */}
           <div className="flex flex-col items-center gap-3 min-w-[110px]">
              <span className="text-[9px] font-black text-white italic uppercase tracking-tighter text-center h-4">VALUE DEALS</span>
              <div className="relative h-28 w-28 rounded-full bg-[#FFCC00] border-4 border-[#FFCC00] shadow-2xl flex flex-col items-center justify-center p-3 overflow-hidden group">
                 <div className="absolute inset-0 bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                 <img src="https://picsum.photos/seed/99store/150/150" className="h-16 w-16 object-cover rounded-full mb-1 shadow-md" alt="" />
                 <span className="bg-white text-[#3F0000] text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm">99 store</span>
              </div>
              <span className="text-[10px] font-black text-[#FFCC00] italic uppercase tracking-widest">• Meal At ₹99 •</span>
           </div>

           {/* Deal 2 */}
           <div className="flex flex-col items-center gap-3 min-w-[110px]">
              <span className="text-[9px] font-black text-white italic uppercase tracking-tighter text-center h-4">DEAL FEAST</span>
              <div className="relative h-28 w-28 rounded-full bg-[#FFCC00] border-4 border-[#FFCC00] shadow-2xl flex flex-col items-center justify-center p-1">
                 <div className="w-full h-full bg-[#0055FF] rounded-full flex flex-col items-center justify-center text-white border-2 border-dashed border-white/30">
                    <span className="text-[8px] font-black uppercase">MIN</span>
                    <span className="text-2xl font-black italic tracking-tighter leading-none">50%</span>
                    <span className="text-[10px] font-black uppercase tracking-tighter">OFF</span>
                 </div>
              </div>
              <span className="text-[10px] font-black text-[#FFCC00] italic uppercase tracking-widest">• On Your Favs •</span>
           </div>

           {/* Deal 3 */}
           <div className="flex flex-col items-center gap-3 min-w-[110px]">
              <span className="text-[9px] font-black text-white italic uppercase tracking-tighter text-center h-4">BINGE SAVER</span>
              <div className="relative h-28 w-28 rounded-full bg-[#FFCC00] border-4 border-[#FFCC00] shadow-2xl flex flex-col items-center justify-center p-3">
                 <img src="https://picsum.photos/seed/binge/150/150" className="h-16 w-16 object-cover rounded-full mb-1 shadow-md" alt="" />
                 <div className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded shadow-sm">Flat ₹200</div>
              </div>
              <span className="text-[10px] font-black text-[#FFCC00] italic uppercase tracking-widest">• Flat ₹200 Off •</span>
           </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleClose}
          className="w-full h-16 bg-[#FF4D00] hover:bg-[#FF6A00] text-white rounded-[2rem] font-black uppercase italic text-lg shadow-[0_15px_30px_rgba(255,77,0,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3 border-b-4 border-black/20"
        >
          CLAIM YOUR FEAST NOW
        </Button>
        
        <p className="text-center text-[8px] text-white/30 font-black mt-6 uppercase tracking-[0.4em] italic">
          ShopyKart Carnival • Limited Slots Only
        </p>
      </div>
    </div>
  );
}
