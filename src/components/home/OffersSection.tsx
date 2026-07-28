"use client"

import { Copy, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Offers & Coupons Section.
 * Redesigned to match the requested ticket-style UI with crown icon.
 */
export default function OffersSection() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const couponsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'coupons');
  }, [firestore]);

  const { data: dbCoupons, loading } = useCollection<any>(couponsQuery);

  const handleCopy = (code: string) => {
    if (typeof window !== 'undefined') {
      const textArea = document.createElement("textarea");
      textArea.value = code;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          toast({
            title: "Coupon Copied!",
            description: `${code} is ready to use!`,
          });
        }
      } catch (err) {
        console.warn("Fallback copy failed", err);
      }
      
      document.body.removeChild(textArea);

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).catch(() => {});
      }
    }
  };

  if (loading || !dbCoupons || dbCoupons.length === 0) return null;

  return (
    <div className="py-6">
      <div className="flex items-center px-6 mb-5">
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-gray-800">Exclusive <span className="text-primary">Deals</span></h2>
      </div>
      <div className="flex overflow-x-auto space-x-4 px-6 no-scrollbar pb-6 scroll-smooth">
        {dbCoupons.map((coupon: any) => {
          const displayValue = coupon.discountType === 'percentage' 
            ? `${coupon.discountValue}%` 
            : `Rs, ${coupon.discountValue}`;

          return (
            <div 
              key={coupon.id}
              onClick={() => handleCopy(coupon.code)}
              className="relative min-w-[280px] h-24 rounded-2xl bg-[#FDF2D0] flex shadow-lg cursor-pointer active:scale-95 transition-all transform-gpu border border-[#E8D9A8]/40"
            >
              {/* Ticket Left Scalloped Edge */}
              <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 h-6 w-4 bg-white rounded-full z-10" />

              <div className="flex-1 p-4 flex flex-col justify-center relative z-20 pl-6">
                <h3 className="text-sm font-black text-[#5C4D3C] uppercase leading-tight tracking-tight">
                  Get <span className="text-[#8C7A63]">{displayValue} OFF</span> - Use
                </h3>
                <p className="text-sm font-black text-[#5C4D3C] uppercase mt-0.5">
                  code: <span className="text-[#8C7A63]">{coupon.code}</span>
                </p>
              </div>
              
              {/* Dashed Divider */}
              <div className="w-[2px] h-full border-l-2 border-dashed border-[#E8D9A8] my-4" />
              
              {/* Right Section with Crown */}
              <div className="w-16 flex items-center justify-center bg-white/20 relative rounded-r-2xl overflow-hidden">
                <Crown className="h-8 w-8 text-[#C5A021] fill-[#C5A021]/10 opacity-60 transform rotate-12" />
                
                {/* Ticket Right Scalloped Edge */}
                <div className="absolute right-[-8px] top-1/2 -translate-y-1/2 h-6 w-4 bg-white rounded-full z-10" />
              </div>

              {/* Subtle texture or shine */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
