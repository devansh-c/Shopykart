
"use client"

import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

const MOCK_COUPONS = [
  {
    id: 'c1',
    discount: '50% OFF',
    minOrder: 'Min Order ₹300',
    type: 'FIRST ORDER',
    code: 'FIRST50',
    gradient: 'from-[#ff4b4b] to-[#dc2626]'
  },
  {
    id: 'c2',
    discount: '₹100 OFF',
    minOrder: 'Min Order ₹500',
    type: 'EVERYDAY',
    code: 'SAVE100',
    gradient: 'from-[#5f259f] to-[#4c1d80]'
  }
];

export function OffersSection() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const couponsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'coupons');
  }, [firestore]);

  const { data: dbCoupons, loading } = useCollection(couponsQuery);

  // Fallback to mock coupons immediately to avoid blank section
  const coupons = (dbCoupons && dbCoupons.length > 0) ? dbCoupons : MOCK_COUPONS;

  const handleCopy = (code: string) => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      toast({
        title: "Coupon Copied!",
        description: `${code} has been copied to your clipboard.`,
      });
    }
  };

  return (
    <div className="py-4">
      <div className="flex items-center px-6 mb-4">
        <span className="text-xl mr-2">🏷️</span>
        <h2 className="text-2xl font-black tracking-tight">Offers & Coupons</h2>
      </div>
      <div className="flex overflow-x-auto space-x-4 px-6 no-scrollbar">
        {coupons.map((coupon: any) => (
          <div 
            key={coupon.id}
            className={`min-w-[280px] h-32 rounded-2xl bg-gradient-to-r ${coupon.gradient || 'from-primary to-accent'} p-5 flex text-white shadow-md relative overflow-hidden`}
          >
            <div className="flex-1 flex flex-col justify-between relative z-10">
              <div>
                <h3 className="text-3xl font-black leading-none italic tracking-tighter">{coupon.discount}</h3>
                <p className="text-[10px] font-bold opacity-80 mt-1.5 uppercase tracking-wider">{coupon.minOrder}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm self-start px-3 py-1 rounded-full border border-white/10">
                <span className="text-[10px] font-black uppercase tracking-widest">{coupon.type}</span>
              </div>
            </div>
            
            <div className="w-[1px] bg-white/30 mx-3 border-dashed border-l" />
            
            <div className="w-20 flex flex-col items-center justify-center relative z-10">
              <div className="border-2 border-dashed border-white/40 p-2 rounded-xl mb-2 w-full text-center">
                <span className="text-xs font-black tracking-widest">{coupon.code}</span>
              </div>
              <button 
                onClick={() => handleCopy(coupon.code)}
                className="flex items-center text-[8px] font-black bg-white/20 backdrop-blur-md text-white px-2 py-1.5 rounded-lg active:scale-95 transition-all border border-white/20"
              >
                <Copy className="h-2.5 w-2.5 mr-1" />
                Tap to copy
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
