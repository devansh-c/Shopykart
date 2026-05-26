'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/components/cart/CartProvider';
import { useToast } from '@/hooks/use-toast';
import { Utensils, IndianRupee, Sparkles, CheckCircle2, ShieldCheck, Stars } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CustomDishDialog({ children }: { children: React.ReactNode }) {
  const [dishName, setDishName] = useState('');
  const [approxPrice, setApproxPrice] = useState('');
  const [open, setOpen] = useState(false);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddCustom = () => {
    if (!dishName.trim() || !approxPrice) {
      toast({ variant: "destructive", title: "Missing details", description: "Please enter dish name and price." });
      return;
    }

    const basePrice = parseFloat(approxPrice);
    const surcharge = basePrice < 100 ? 20 : 40;

    const customItem = {
      id: `custom_${Date.now()}`,
      name: `[CUSTOM] ${dishName}`,
      price: basePrice,
      quantity: 1,
      imageUrl: 'https://picsum.photos/seed/custom-dish/400/400',
      isCustom: true,
      customSurcharge: surcharge,
      restaurantName: 'Custom Store'
    };

    addToCart(customItem);
    setOpen(false);
    setDishName('');
    setApproxPrice('');
    
    toast({
      title: "Request Received! ✨",
      description: `Dish: ${dishName}. Our team is on it.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="rounded-[3rem] max-w-sm border-none shadow-2xl bg-white overflow-hidden p-0">
        {/* Luxury top accent */}
        <div className="h-2 w-full bg-gradient-to-r from-amber-400 via-amber-600 to-amber-400" />
        
        <div className="p-8 space-y-8 relative">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <Utensils className="h-32 w-32 rotate-12" />
          </div>

          <div className="flex flex-col items-center text-center space-y-4 relative z-10">
             <div className="h-20 w-20 bg-gradient-to-br from-amber-50 to-amber-100 rounded-[2rem] flex items-center justify-center text-amber-600 shadow-inner border border-amber-200/50">
                <div className="relative">
                  <Utensils className="h-10 w-10" />
                  <Stars className="absolute -top-3 -right-3 h-5 w-5 animate-pulse" />
                </div>
             </div>
             
             <DialogHeader>
                <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-black leading-none">
                  Concierge <span className="text-amber-600">Service.</span>
                </DialogTitle>
             </DialogHeader>
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] leading-relaxed max-w-[200px]">
               Tailor-made orders for your specific cravings.
             </p>
          </div>

          <div className="space-y-5 relative z-10">
            <div className="space-y-2">
               <label className="text-[9px] font-black text-amber-700 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <Sparkles className="h-2.5 w-2.5" /> What are you looking for?
               </label>
               <Input 
                placeholder="e.g. Traditional Paneer Tikka" 
                value={dishName}
                onChange={e => setDishName(e.target.value)}
                className="h-14 rounded-2xl bg-gray-50 border-none font-bold placeholder:text-gray-300 focus-visible:ring-1 focus-visible:ring-amber-500/20"
               />
            </div>
            
            <div className="space-y-2">
               <label className="text-[9px] font-black text-amber-700 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <IndianRupee className="h-2.5 w-2.5" /> Estimated Value
               </label>
               <div className="relative">
                 <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-600" />
                 <Input 
                  type="number"
                  placeholder="0.00" 
                  value={approxPrice}
                  onChange={e => setApproxPrice(e.target.value)}
                  className="h-16 pl-12 rounded-2xl bg-gray-50 border-none font-black italic text-2xl text-gray-800"
                 />
               </div>
            </div>

            <div className="bg-[#0B0B0B] p-6 rounded-[2rem] border border-white/5 shadow-xl space-y-3">
               <div className="flex items-center gap-2 text-amber-400">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Premium Handling Fee</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Under ₹100 Order</span>
                  <span className="text-xs font-black text-white italic">+ ₹20</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">₹100+ Order</span>
                  <span className="text-xs font-black text-white italic">+ ₹40</span>
               </div>
            </div>
          </div>

          <Button 
            onClick={handleAddCustom}
            className="w-full h-18 py-8 bg-amber-600 hover:bg-amber-700 text-white rounded-[2rem] font-black uppercase italic text-lg shadow-2xl shadow-amber-200 transition-all active:scale-95 border-b-4 border-amber-800"
          >
            CONFIRM REQUEST
          </Button>

          <p className="text-center text-[8px] font-black text-gray-300 uppercase tracking-[0.4em]">
             ShopyKart Elite Network
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
