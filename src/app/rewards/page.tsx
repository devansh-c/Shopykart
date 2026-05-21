
"use client"

import { BottomNav } from '@/components/shared/BottomNav';
import { Star, Trophy, ArrowRight, Copy, Info, Coins, History, Gift, IndianRupee } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function RewardsPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState('points');

  // 1. Fetch Economy Settings (for coin value)
  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);
  const { data: branding } = useDoc<any>(brandingRef);
  
  const coinValue = branding?.coinValue || 0.5;

  // 2. Fetch User Profile
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: profile } = useDoc<any>(profileRef);
  const currentCoins = profile?.coins || 0;

  const handleCopy = (code: string) => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      toast({
        title: "Code Copied!",
        description: `${code} is ready to use at checkout.`,
      });
    }
  };

  const coupons = [
    { code: 'FIRST50', desc: '50% Off your first order', minOrder: '₹300', color: 'bg-red-500' },
    { code: 'WEEKEND20', desc: '20% Off every weekend', minOrder: '₹500', color: 'bg-amber-500' },
    { code: 'PARTY30', desc: '30% Off on party orders', minOrder: '₹1200', color: 'bg-indigo-500' },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-32">
      <div className="px-6 pt-12 pb-6 flex items-center justify-between">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">My Rewards</h1>
        <button className="h-10 w-10 bg-white rounded-full shadow-sm border border-border/50 flex items-center justify-center">
          <Info className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      <div className="px-4 space-y-6">
        {/* Points Card */}
        <div className="bg-primary rounded-[2rem] p-8 text-primary-foreground relative overflow-hidden shadow-xl shadow-primary/20">
          <div className="absolute -top-10 -right-10 h-48 w-48 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 h-32 w-32 bg-black/10 rounded-full blur-xl" />
          
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-2">
              <Coins className="h-5 w-5 fill-white text-white" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Available Coins</span>
            </div>
            <div className="text-6xl font-black italic tracking-tighter leading-none mb-4">{currentCoins}</div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-wider opacity-80">
                <span>Value: ₹{(currentCoins * coinValue).toFixed(2)}</span>
                <span>Earn on every order</span>
              </div>
              <Progress value={Math.min(100, (currentCoins / 5000) * 100)} className="h-2 bg-white/20" />
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-muted p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('points')}
            className={cn(
              "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeTab === 'points' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"
            )}
          >
            My Points
          </button>
          <button 
            onClick={() => setActiveTab('coupons')}
            className={cn(
              "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeTab === 'coupons' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"
            )}
          >
            Coupons
          </button>
        </div>

        {activeTab === 'points' ? (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 border border-border/40 shadow-sm text-center">
               <div className="bg-amber-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-amber-100">
                  <Trophy className="h-10 w-10 text-amber-500" />
               </div>
               <h2 className="text-2xl font-black italic uppercase tracking-tight">How it works?</h2>
               <div className="text-xs text-muted-foreground font-bold mt-2 leading-relaxed px-4 uppercase space-y-1">
                 <p>Har order par <span className="text-primary">Bonus Coins</span> mileinge.</p>
                 <p>Checkout ke waqt <span className="text-primary">1 Coin = ₹{coinValue}</span> ka discount milega!</p>
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-black italic uppercase tracking-tight ml-2">My Coupons</h2>
            {coupons.map((coupon, i) => (
              <div key={i} className="relative bg-white rounded-3xl p-6 border-2 border-dashed border-muted-foreground/20 flex flex-col gap-4 active:scale-[0.98] transition-all overflow-hidden group">
                <div className={cn("absolute top-0 right-0 h-2 w-full", coupon.color)} />
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black italic italic uppercase tracking-tighter">{coupon.code}</h3>
                    <p className="text-xs text-muted-foreground font-medium">{coupon.desc}</p>
                  </div>
                  <button 
                    onClick={() => handleCopy(coupon.code)}
                    className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
