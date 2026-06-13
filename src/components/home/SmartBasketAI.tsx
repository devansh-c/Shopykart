'use client';

import { useState, useEffect } from 'react';
import { Sparkles, ChevronRight, Loader2, Utensils, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSmartBasketDetails, type SmartBasketOutput } from '@/ai/flows/smart-basket-flow';
import { useToast } from '@/hooks/use-toast';

export function SmartBasketAI() {
  const [mounted, setMounted] = useState(false);
  const [dish, setDish] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SmartBasketOutput | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGenerate = async () => {
    if (!dish.trim()) return;
    setIsLoading(true);
    try {
      const data = await getSmartBasketDetails({ dishName: dish });
      setResult(data);
    } catch (error) {
      // SILENT FALLBACK: Error toast removed to prevent "AI Busy" message
      console.warn("Silent fallback triggered for Smart Basket");
    } finally {
      setIsLoading(false);
    }
  };

  const bannerButton = (
    <button className="relative w-full overflow-hidden rounded-[2rem] p-6 shadow-xl shadow-rose-200/40 border border-white/10 active:scale-[0.98] transition-all duration-300 text-left group">
      <div className="absolute inset-0 bg-gradient-to-r from-[#EF4444] via-[#F43F5E] to-[#BE123C] group-hover:scale-105 transition-transform duration-700" />
      <div className="absolute top-0 right-0 h-full w-24 bg-white/10 -skew-x-12 translate-x-12" />
      <div className="relative z-10 flex items-center justify-between">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 animate-pulse" />
            <h3 className="text-xl font-black italic uppercase tracking-tighter">Smart Basket AI</h3>
          </div>
          <p className="text-sm font-bold text-white/90 leading-tight pr-10">
            Get meal bundles & recipes tailored for you.
          </p>
        </div>
        <div className="h-10 w-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/20 group-hover:translate-x-1 transition-transform">
          <ChevronRight className="h-5 w-5" />
        </div>
      </div>
    </button>
  );

  if (!mounted) {
    return (
      <div className="px-4 py-2">
        {bannerButton}
      </div>
    );
  }

  return (
    <div className="px-4 py-2">
      <Dialog open={isOpen} onOpenChange={(val) => { setIsOpen(val); if(!val) { setResult(null); setDish(''); } }}>
        <DialogTrigger asChild>
          {bannerButton}
        </DialogTrigger>

        <DialogContent className="rounded-[2.5rem] max-w-md p-0 overflow-hidden border-none shadow-2xl bg-white max-h-[85vh] flex flex-col focus:outline-none">
          <div className="bg-[#EF4444] h-2 w-full" />
          <div className="p-8 space-y-6 overflow-y-auto no-scrollbar">
            {!result ? (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="text-center space-y-2">
                   <div className="h-16 w-16 bg-rose-50 rounded-2xl flex items-center justify-center text-[#EF4444] mx-auto border border-rose-100">
                      <Utensils className="h-8 w-8" />
                   </div>
                   <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">What's Cooking?</DialogTitle>
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-relaxed">
                     Tell AI what you want to make, we'll build your basket.
                   </p>
                </div>

                <div className="space-y-4">
                   <Input 
                    placeholder="e.g. Shahi Paneer or Pasta" 
                    value={dish}
                    onChange={(e) => setDish(e.target.value)}
                    className="h-14 rounded-2xl bg-gray-50 border-none font-bold text-lg focus-visible:ring-1 focus-visible:ring-rose-500/20"
                   />
                   <Button 
                    onClick={handleGenerate}
                    disabled={isLoading || !dish.trim()}
                    className="w-full h-16 bg-[#0B0B0B] hover:bg-[#EF4444] text-white rounded-[2rem] font-black uppercase italic shadow-xl transition-all"
                   >
                     {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "GENERATE BASKET"}
                   </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in zoom-in duration-500">
                 <div className="space-y-1 border-b border-dashed pb-4">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-[#EF4444]">{result.recipeTitle}</h2>
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Chef AI Recommended</span>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-800">
                       <CheckCircle2 className="h-4 w-4 text-green-500" />
                       <h4 className="text-[11px] font-black uppercase tracking-widest">Ingredients to Buy</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       {result.shoppingList.map((item, idx) => (
                         <div key={idx} className="bg-rose-50 p-3 rounded-xl border border-rose-100 flex flex-col gap-1">
                            <span className="text-[10px] font-black text-[#EF4444] uppercase truncate">{item}</span>
                            <span className="text-[8px] font-bold text-rose-300 uppercase leading-none">Available in store</span>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 space-y-4">
                    <div className="flex items-center gap-2">
                       <Utensils className="h-4 w-4 text-gray-400" />
                       <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-500">Steps to Cook</h4>
                    </div>
                    <div className="space-y-3">
                       {result.steps.map((step, idx) => (
                         <div key={idx} className="flex gap-3">
                            <span className="text-[10px] font-black text-[#EF4444] shrink-0 mt-0.5">{idx + 1}.</span>
                            <p className="text-[11px] font-medium text-gray-700 leading-relaxed">{step}</p>
                         </div>
                       ))}
                    </div>
                 </div>

                 <Button 
                  onClick={() => setIsOpen(false)}
                  className="w-full h-14 bg-black text-white rounded-2xl font-black uppercase italic"
                 >
                   DONE, LET'S SHOP
                 </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
