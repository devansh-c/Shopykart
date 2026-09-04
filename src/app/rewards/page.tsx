
"use client"

import { Star, Trophy, ArrowRight, Copy, Info, Coins, History, Gift, IndianRupee, Sparkles, UserPlus, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';

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
            title: "Code Copied!",
            description: `${code} is ready to use at checkout.`,
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

  const handleOpenAuth = () => {
    window.dispatchEvent(new CustomEvent('open-auth-overlay'));
  };

  const coupons = [
    { code: 'FIRST50', desc: '50% Off your first order', minOrder: '₹300', color: 'bg-red-500' },
    { code: 'WEEKEND20', desc: '20% Off every weekend', minOrder: '₹500', color: 'bg-amber-500' },
    { code: 'PARTY30', desc: '30% Off on party orders', minOrder: '₹1200', color: 'bg-indigo-500' },
  ];

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="px-6 pt-12 pb-6 flex items-center justify-between">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900">My Rewards</h1>
        <button className="h-10 w-10 bg-white rounded-full shadow-sm border border-border/50 flex items-center justify-center">
          <Info className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      <div className="px-4 space-y-6">
        {/* Guest View: Register & Get Coins */}
        {!user ? (
          <div className="bg-[#0B0B0B] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl border border-white/5 animate-in fade-in zoom-in duration-500">
             <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                   <div className="h-14 w-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                      <Sparkles className="h-8 w-8 animate-pulse" />
                   </div>
                   <div>
                      <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">JOIN NOW</h2>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Get instant welcome reward</p>
                   </div>
                </div>

                <div className="bg-white/5 p-6 rounded-[1.5rem] border border-white/10 text-center">
                   <span className="text-[10px] font-black uppercase text-primary tracking-[0.3em] block mb-2">Welcome Bonus</span>
                   <div className="text-4xl font-black italic text-white tracking-tighter mb-1">20 FREE COINS</div>
                   <p className="text-[9px] font-bold text-gray-400 uppercase leading-relaxed">Redeemable on your very first order at ShopyKart.</p>
                </div>

                <Button 
                  onClick={handleOpenAuth}
                  className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-[1.5rem] font-black uppercase italic text-lg shadow-xl shadow-primary/20 active:scale-95 transition-all"
                >
                  <UserPlus className="h-5 w-5 mr-3" />
                  REGISTER & CLAIM
                </Button>
             </div>
             <div className="absolute top-0 right-0 h-full w-40 bg-white/5 -skew-x-12 translate-x-12 pointer-events-none" />
          </div>
        ) : (
          /* Points Card for Logged-in Users */
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
                  <span>Keep ordering to earn more</span>
                </div>
                <Progress value={Math.min(100, (currentCoins / 1000) * 100)} className="h-2 bg-white/20" />
              </div>
            </div>
          </div>
        )}

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
               <div className="text-xs text-muted-foreground font-bold mt-4 leading-relaxed px-4 uppercase space-y-6">
                 <div className="flex items-center gap-4 text-left p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="h-10 w-10 bg-primary text-white rounded-xl flex items-center justify-center font-black italic">1st</div>
                    <div>
                       <p className="text-gray-900 leading-none mb-1">Earn 20 Coins</p>
                       <p className="text-[9px] text-gray-400">On your very first order</p>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-4 text-left p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="h-10 w-10 bg-primary/20 text-primary rounded-xl flex items-center justify-center font-black italic">2nd</div>
                    <div>
                       <p className="text-gray-900 leading-none mb-1">Earn 10 Coins</p>
                       <p className="text-[9px] text-gray-400">On your second order</p>
                    </div>
                 </div>

                 <div className="flex items-center gap-4 text-left p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="h-10 w-10 bg-gray-200 text-gray-500 rounded-xl flex items-center justify-center font-black italic">3+</div>
                    <div>
                       <p className="text-gray-900 leading-none mb-1">Earn 5 Coins</p>
                       <p className="text-[9px] text-gray-400">On every subsequent order</p>
                    </div>
                 </div>

                 <div className="pt-2 text-[10px] text-gray-400 border-t border-dashed">
                    <Zap className="h-3 w-3 inline mr-1 text-amber-500" />
                    Redeem at checkout: 1 Coin = ₹{coinValue} discount!
                 </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-black italic uppercase tracking-tight ml-2 text-gray-900">My Coupons</h2>
            {coupons.map((coupon, i) => (
              <div key={i} className="relative bg-white rounded-3xl p-6 border-2 border-dashed border-muted-foreground/20 flex flex-col gap-4 active:scale-[0.98] transition-all overflow-hidden group">
                <div className={cn("absolute top-0 right-0 h-2 w-full", coupon.color)} />
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900">{coupon.code}</h3>
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
    </div>
  );
}
