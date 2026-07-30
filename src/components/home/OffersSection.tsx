"use client"

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import { Crown, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * @fileOverview OffersSection - Real coupons with background sync.
 */
export default function OffersSection() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const couponsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'coupons');
  }, [firestore]);

  const { data: dbCoupons, loading } = useCollection<any>(couponsQuery, 'home_coupons_v4_ssr_sync');

  const handleCopy = (code: string) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(code);
      toast({ title: "Coupon Copied! ✨", description: `${code} is ready!` });
    }
  };

  if (loading && !dbCoupons) return null;
  if (!dbCoupons || dbCoupons.length === 0) return null;

  return (
    <div className="py-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-6 mb-5">
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-gray-800 flex items-center gap-2">
           <Sparkles className="h-4 w-4 text-primary animate-pulse" />
           Exclusive <span className="text-primary">Deals</span>
        </h2>
      </div>
      <div className="flex overflow-x-auto space-x-4 px-6 no-scrollbar pb-6">
        {dbCoupons.map((coupon: any) => (
          <div 
            key={coupon.id}
            onClick={() => handleCopy(coupon.code)}
            className="relative min-w-[280px] h-24 rounded-2xl bg-[#FDF2D0] flex shadow-lg cursor-pointer active:scale-95 transition-all border border-[#E8D9A8]/40 overflow-hidden group"
          >
            <div className="flex-1 p-4 flex flex-col justify-center pl-6">
              <h3 className="text-sm font-black text-[#5C4D3C] uppercase leading-tight">Get {coupon.discountValue}{coupon.discountType === 'percentage' ? '%' : '₹'} OFF</h3>
              <p className="text-[10px] font-black text-[#8C7A63] uppercase mt-1 tracking-widest italic">code: <span className="text-primary">{coupon.code}</span></p>
            </div>
            <div className="w-[2px] h-full border-l-2 border-dashed border-[#E8D9A8] my-4" />
            <div className="w-16 flex items-center justify-center bg-white/20 group-hover:bg-primary group-hover:text-white transition-all">
              <Crown className="h-8 w-8 text-[#C5A021] opacity-60 transform rotate-12 group-hover:rotate-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
