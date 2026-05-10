
"use client"

import { Tag, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const coupons = [
  {
    id: 'o1',
    discount: '20% OFF',
    minOrder: 'Min order ₹200 ...',
    code: 'FIRST20',
    type: 'FIRST ORDER',
    gradient: 'from-[#ff4b4b] to-[#dc2626]'
  },
  {
    id: 'o2',
    discount: '10% OFF',
    minOrder: 'Min order ₹300 ...',
    code: 'FEAST10',
    type: 'EVERYDAY',
    gradient: 'from-[#f59e0b] to-[#d97706]'
  }
];

export function OffersSection() {
  const { toast } = useToast();

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Coupon Copied!",
      description: `${code} has been copied to your clipboard.`,
    });
  };

  return (
    <div className="py-6">
      <div className="flex items-center px-4 mb-4">
        <span className="text-2xl mr-2">🏷️</span>
        <h2 className="text-2xl font-black">Offers & Coupons</h2>
      </div>
      <div className="flex overflow-x-auto space-x-4 px-4 no-scrollbar">
        {coupons.map((coupon) => (
          <div 
            key={coupon.id}
            className={`min-w-[300px] h-40 rounded-[2rem] bg-gradient-to-r ${coupon.gradient} p-5 flex text-white shadow-lg relative overflow-hidden`}
          >
            <div className="flex-1 flex flex-col justify-between relative z-10">
              <div>
                <h3 className="text-4xl font-black leading-none">{coupon.discount}</h3>
                <p className="text-[10px] font-bold opacity-80 mt-1 uppercase tracking-wider">{coupon.minOrder}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm self-start px-3 py-1 rounded-lg border border-white/20">
                <span className="text-[10px] font-black uppercase tracking-widest">{coupon.type}</span>
              </div>
            </div>
            
            <div className="w-[1px] bg-white/30 mx-4 border-dashed border-l" />
            
            <div className="w-24 flex flex-col items-center justify-center relative z-10">
              <div className="border-2 border-dashed border-white/40 p-2 rounded-xl mb-2 w-full text-center">
                <span className="text-sm font-black tracking-widest">{coupon.code}</span>
              </div>
              <button 
                onClick={() => handleCopy(coupon.code)}
                className="flex items-center text-[8px] font-black bg-white text-foreground px-2 py-1.5 rounded-lg active:scale-95 transition-all"
              >
                <Copy className="h-2 w-2 mr-1" />
                Tap to copy
              </button>
            </div>

            {/* Decorative background circles */}
            <div className="absolute -right-10 -top-10 h-32 w-32 bg-white/10 rounded-full" />
            <div className="absolute -left-10 -bottom-10 h-24 w-24 bg-white/5 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
