
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/components/cart/CartProvider';
import { useToast } from '@/hooks/use-toast';
import { Utensils, IndianRupee, Sparkles, CheckCircle2 } from 'lucide-react';

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
      imageUrl: 'https://picsum.photos/seed/custom/400/400',
      isCustom: true,
      customSurcharge: surcharge,
      restaurantName: 'Custom Store'
    };

    addToCart(customItem);
    setOpen(false);
    setDishName('');
    setApproxPrice('');
    
    toast({
      title: "Custom Dish Added!",
      description: `Dish: ${dishName}. Surcharge ₹${surcharge} will be added at checkout.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="rounded-[3rem] max-w-sm border-none shadow-2xl bg-white overflow-hidden p-0">
        <div className="bg-primary h-2 w-full" />
        <div className="p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
             <div className="h-16 w-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-2">
                <Utensils className="h-8 w-8" />
             </div>
             <DialogHeader>
                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-black leading-none">
                  Special <span className="text-primary">Request.</span>
                </DialogTitle>
             </DialogHeader>
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-relaxed">
               Can't find what you need? Tell us, we'll fetch it for you.
             </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">What do you want?</label>
               <Input 
                placeholder="e.g. Masala Dosa from local shop" 
                value={dishName}
                onChange={e => setDishName(e.target.value)}
                className="h-14 rounded-2xl bg-gray-50 border-none font-bold"
               />
            </div>
            
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Approx Base Price (₹)</label>
               <div className="relative">
                 <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                 <Input 
                  type="number"
                  placeholder="0.00" 
                  value={approxPrice}
                  onChange={e => setApproxPrice(e.target.value)}
                  className="h-14 pl-10 rounded-2xl bg-gray-50 border-none font-black italic text-xl"
                 />
               </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border-2 border-dashed border-amber-100 space-y-2">
               <div className="flex items-center gap-2 text-amber-700">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  <span className="text-[10px] font-black uppercase">Service Charges</span>
               </div>
               <p className="text-[9px] font-bold text-amber-800 uppercase leading-tight">
                 • Under ₹100: <span className="text-primary">₹20 EXTRA</span><br />
                 • ₹100 or more: <span className="text-primary">₹40 EXTRA</span>
               </p>
            </div>
          </div>

          <Button 
            onClick={handleAddCustom}
            className="w-full h-16 bg-[#0B0B0B] hover:bg-primary text-white rounded-3xl font-black uppercase italic shadow-xl transition-all active:scale-95"
          >
            ADD TO MY BAG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
