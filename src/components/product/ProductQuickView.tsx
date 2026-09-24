
'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Minus, 
  Loader2, 
  Clock, 
  Timer, 
  ListTree,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/components/cart/CartProvider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { isStoreScheduleOpen } from '@/components/home/PopularProducts';

interface ProductQuickViewProps {
  product: any;
  children: React.ReactNode;
  isMedical?: boolean;
  vendorScheduleOpen?: boolean;
}

export function ProductQuickView({ product, children, isMedical, vendorScheduleOpen }: ProductQuickViewProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isOpen, setIsOpen] = useState(false);
  const [localQuantity, setLocalQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState<{ name: string; price: number } | null>(null);
  const [instructions, setInstructions] = useState('');

  const vendorsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'vendors') : null, [firestore]);
  const { data: vendors } = useCollection<any>(vendorsQuery);
  const vendor = vendors?.find(v => String(v.id) === String(product.vendorId));
  const scheduleOpen = vendorScheduleOpen !== undefined ? vendorScheduleOpen : isStoreScheduleOpen(vendor);
  const isOffline = (vendor?.isOnline === false) || !scheduleOpen;

  const offerRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_offer') : null, [firestore]);
  const { data: globalOffer } = useDoc<any>(offerRef);

  const currentPrice = useMemo(() => {
    const base = product.price || 0;
    const optPrice = selectedOption ? selectedOption.price : 0;
    const totalBase = base + optPrice;
    
    if (globalOffer?.isActive && globalOffer?.isClosedAfterMilestone !== true) {
      if (globalOffer.type === 'percentage') return totalBase * (1 - (Number(globalOffer.value) || 0) / 100);
      return Math.max(0, totalBase - (Number(globalOffer.value) || 0));
    }
    return totalBase;
  }, [product.price, selectedOption, globalOffer]);

  const handleAddToCart = () => {
    if (isOffline) return;

    if (product.isVarietyRequired && !selectedOption) {
      toast({ variant: "destructive", title: "Select a Variety", description: "Please pick an option to continue." });
      return;
    }

    addToCart({ ...product, imageUrl: product.imageUrl, quantity: localQuantity, selectedOption, instructions, price: currentPrice });
    setIsOpen(false); 
    setLocalQuantity(1); 
    setSelectedOption(null);
    toast({ title: "Added to Bag" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="rounded-t-[3.5rem] p-0 overflow-hidden border-none shadow-2xl z-[2000001] bottom-0 top-auto translate-y-0 focus:outline-none h-[90vh] max-w-lg flex flex-col bg-[#0B0B0B]">
        <DialogHeader className="p-6 pb-4 shrink-0 border-b border-white/5 relative z-10 text-white">
          <DialogTitle className="font-black italic uppercase text-center text-xl tracking-tighter">{product.name}</DialogTitle>
          <DialogDescription className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-500">Customize your premium order</DialogDescription>
          <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/5 flex items-center justify-center text-gray-400 active:scale-90 transition-transform"><X className="h-4 w-4" /></button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto no-scrollbar relative z-0">
          <div className="p-6 pt-4 flex gap-4 border-b border-dashed border-white/10">
             <div className="relative h-24 w-24 rounded-2xl overflow-hidden bg-muted border border-white/10 shadow-sm shrink-0">
                <Image src={product.imageUrl} alt={product.name} fill className="object-cover" unoptimized />
             </div>
             <div className="flex-1 min-w-0">
                <h3 className="font-black text-lg text-white italic uppercase tracking-tighter leading-tight line-clamp-2">{product.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                   <p className="text-[9px] font-black text-primary uppercase tracking-widest italic">{product.restaurantName || 'ShopyKart Store'}</p>
                   {product.preparingTime && (
                     <Badge className="bg-green-600/20 text-green-400 border-none font-black text-[7px] uppercase px-1.5 py-0">
                        <Timer className="h-2 w-2 mr-1" /> {product.preparingTime}M
                     </Badge>
                   )}
                </div>
                <div className="text-2xl font-black text-white italic tracking-tighter mt-1">₹ {currentPrice.toFixed(0)}</div>
             </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            {product.description && <p className="text-[11px] font-medium text-gray-400 italic leading-relaxed">{product.description}</p>}
            
            {product.options && product.options.length > 0 && (
              <div className="space-y-4 pt-2 bg-white/5 p-6 rounded-[2.5rem] border border-white/5">
                 <div className="flex items-center gap-2">
                    <ListTree className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 italic">Varieties {product.isVarietyRequired && <span className="text-primary">*</span>}</span>
                 </div>
                 <div className="grid grid-cols-1 gap-3">
                    {product.options.map((opt: any, idx: number) => (
                      <button 
                        key={idx}
                        onClick={() => setSelectedOption(opt)}
                        className={cn(
                          "flex items-center justify-between p-5 rounded-[1.75rem] border-2 transition-all active:scale-[0.98]",
                          selectedOption?.name === opt.name ? "border-primary bg-primary/20" : "border-white/5 bg-white/5"
                        )}
                      >
                        <div className="flex items-center gap-4">
                           <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center", selectedOption?.name === opt.name ? "border-primary" : "border-white/20")}>
                              {selectedOption?.name === opt.name && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                           </div>
                           <span className={cn("text-xs font-black uppercase italic tracking-widest", selectedOption?.name === opt.name ? "text-white" : "text-gray-500")}>{opt.name}</span>
                        </div>
                        <span className="text-base font-black italic text-primary">₹ {opt.price}</span>
                      </button>
                    ))}
                 </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-gray-500 ml-1">Notes to Chef</label>
              <Textarea 
                disabled={isOffline} 
                placeholder="e.g. no onion, extra spicy..." 
                value={instructions} 
                onChange={e => setInstructions(e.target.value.toUpperCase())} 
                className="rounded-2xl bg-white/5 border-none text-white text-xs min-h-[100px] p-4 focus-visible:ring-1 focus-visible:ring-primary/20" 
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-[#0B0B0B] border-t border-white/5 pb-10 shrink-0 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
           <div className="flex items-center gap-3 max-w-md mx-auto">
              <div className="flex items-center bg-white/5 rounded-xl h-14 px-2 border border-white/5">
                 <button disabled={isOffline} onClick={() => setLocalQuantity(Math.max(1, localQuantity - 1))} className="h-10 w-10 flex items-center justify-center bg-white/10 rounded-lg shadow-sm active:scale-90 transition-transform text-white"><Minus className="h-4 w-4" /></button>
                 <span className="w-10 text-center text-lg font-black italic text-white">{localQuantity}</span>
                 <button disabled={isOffline} onClick={() => setLocalQuantity(localQuantity + 1)} className="h-10 w-10 flex items-center justify-center bg-white/10 rounded-lg shadow-sm active:scale-90 transition-transform text-white"><Plus className="h-4 w-4" /></button>
              </div>
              <Button 
                onClick={handleAddToCart} 
                disabled={isOffline || (product.isVarietyRequired && !selectedOption)}
                className="flex-1 h-14 bg-primary text-white rounded-[1.25rem] font-black uppercase italic text-sm shadow-xl shadow-primary/20 active:scale-95 transition-all"
              >
                {isOffline ? 'TIMING CLOSED' : (product.isVarietyRequired && !selectedOption) ? 'PICK VARIETY' : `ADD • ₹${(currentPrice * localQuantity).toFixed(0)}`}
              </Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
