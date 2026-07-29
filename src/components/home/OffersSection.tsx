"use client"

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import { Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function OffersSection() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const couponsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'coupons');
  }, [firestore]);

  const { data: dbCoupons, loading } = useCollection<any>(couponsQuery, 'home_coupons_v4_instant');

  // HIDE SECTION COMPLETELY IF NO COUPONS OR LOADING
  if (!loading && (!dbCoupons || dbCoupons.length === 0)) {
    return null;
  }

  const handleCopy = (code: string) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(code);
      toast({ title: "Coupon Copied!", description: `${code} is ready!` });
    }
  };

  return (
    <div className="py-6 min-h-[100px] animate-in fade-in duration-500">
      <div className="flex items-center px-6 mb-5">
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-gray-800">Exclusive <span className="text-primary">Deals</span></h2>
      </div>
      <div className="flex overflow-x-auto space-x-4 px-6 no-scrollbar pb-6">
        {loading ? (
          <div className="min-w-[280px] h-24 rounded-2xl bg-muted/10 animate-pulse border-2 border-dashed" />
        ) : dbCoupons?.map((coupon: any) => (
          <div 
            key={coupon.id}
            onClick={() => handleCopy(coupon.code)}
            className="relative min-w-[280px] h-24 rounded-2xl bg-[#FDF2D0] flex shadow-lg cursor-pointer active:scale-95 transition-all border border-[#E8D9A8]/40"
          >
            <div className="flex-1 p-4 flex flex-col justify-center pl-6">
              <h3 className="text-sm font-black text-[#5C4D3C] uppercase leading-tight">Get {coupon.discountValue}{coupon.discountType === 'percentage' ? '%' : '₹'} OFF</h3>
              <p className="text-sm font-black text-[#5C4D3C] uppercase mt-0.5">code: <span className="text-[#8C7A63]">{coupon.code}</span></p>
            </div>
            <div className="w-[2px] h-full border-l-2 border-dashed border-[#E8D9A8] my-4" />
            <div className="w-16 flex items-center justify-center bg-white/20 rounded-r-2xl">
              <Crown className="h-8 w-8 text-[#C5A021] opacity-60 transform rotate-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
