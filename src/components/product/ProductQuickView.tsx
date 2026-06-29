'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Star, 
  Heart, 
  Plus, 
  Minus, 
  CheckCircle2, 
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Zap,
  Loader2,
  Clock
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/components/cart/CartProvider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { isStoreScheduleOpen } from '@/components/home/PopularProducts';

interface ProductQuickViewProps {
  product: any;
  children: React.ReactNode;
  isMedical?: boolean;
  globalOffer?: any;
  vendorScheduleOpen?: boolean;
}

export function ProductQuickView({ product, children, isMedical, globalOffer, vendorScheduleOpen }: ProductQuickViewProps) {
  const { cart, addToCart, isInWishlist, toggleWishlist } = useCart();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isOpen, setIsOpen] = useState(false);
  const [localQuantity, setLocalQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState<{ name: string; price: number } | null>(null);
  const [instructions, setInstructions] = useState('');
  const [, setTick] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => setTick(t => t + 1), 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);
  const { data: vendors } = useCollection<any>(vendorsQuery);

  const vendor = vendors?.find(v => v.id === product.vendorId);
  const scheduleOpen = vendorScheduleOpen !== undefined ? vendorScheduleOpen : isStoreScheduleOpen(vendor);
  // CRITICAL FIX: Ignore product.isAvailable, only rely on Store Online + Timing
  const isOffline = (vendor?.isOnline === false) || !scheduleOpen;

  const liked = isInWishlist(product.id);
  const imageUrl = product.imageUrl || `https://picsum.photos/seed/${product.id}/400/400`;
  const hasOptions = product.options && product.options.length > 0;

  const isSaleActive = globalOffer?.isActive;
  const isClosedMode = isSaleActive && globalOffer?.isClosedAfterMilestone === true;
  
  const currentPrice = useMemo(() => {
    const base = product.price || 0;
    const optPrice = selectedOption ? selectedOption.price : 0;
    const totalBase = base + optPrice;

    if (isClosedMode) return totalBase;

    if (isSaleActive) {
      const val = Number(globalOffer.value) || 0;
      if (globalOffer.type === 'percentage') return totalBase * (1 - val / 100);
      return Math.max(0, totalBase - val);
    }
    return totalBase;
  }, [product, selectedOption, isSaleActive, isClosedMode, globalOffer]);

  const handleAddToCart = () => {
    if (isOffline) return;
    if (product.isVarietyRequired && !selectedOption && hasOptions) {
      toast({ variant: "destructive", title: "Selection Required", description: "Please select a variety first." });
      return;
    }

    addToCart({ ...product, imageUrl, quantity: localQuantity, selectedOption: selectedOption, instructions: isMedical ? '' : instructions, price: currentPrice });
    setIsOpen(false);
    setLocalQuantity(1);
    setSelectedOption(null);
    setInstructions('');
    toast({ title: "Added to Bag", description: `${product.name} added successfully.` });
  };

  const ratingValue = useMemo(() => {
    const hash = product.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return (4 + (hash % 11) / 10).toFixed(1);
  }, [product.id]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl focus:outline-none bottom-0 top-auto translate-y-0 sm:top-[50%] sm:translate-y-[-50%] z-[11000]">
        <DialogHeader className="sr-only"><DialogTitle>{product.name}</DialogTitle></DialogHeader>
        <div className="bg-white relative max-h-[90vh] overflow-y-auto no-scrollbar pb-32">
          <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white shadow-lg border border-border/50 flex items-center justify-center text-gray-400 active:scale-90 transition-none z-50"><X className="h-4 w-4" /></button>

          <div className="p-6 pt-10 pb-4">
             <div className="flex gap-4">
                <div className="relative h-28 w-28 rounded-2xl overflow-hidden bg-muted shrink-0 border border-gray-100 shadow-sm">
                   <Image src={imageUrl} alt={product.name} fill className="object-cover" unoptimized />
                   {product.isVeg && (
                      <div className="absolute top-1.5 left-1.5 h-3.5 w-3.5 border border-green-600 rounded-sm flex items-center justify-center p-0.5 bg-white/90">
                        <div className="h-full w-full bg-green-600 rounded-full" />
                      </div>
                   )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                   <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-black text-xl text-gray-900 leading-tight italic uppercase tracking-tighter line-clamp-2">{product.name}</h3>
                        {isSaleActive && <Zap className="h-3.5 w-3.5 text-primary fill-primary animate-pulse" />}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest italic truncate">{product.restaurantName || 'ShopyKart Store'}</p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                         <div className="flex items-center gap-0.5">
                           <span className="text-[10px] font-black text-gray-800 mr-1">{ratingValue}</span>
                           {[1, 2, 3, 4, 5].map((s) => (
                             <Star key={s} className={cn("h-3 w-3", s <= parseFloat(ratingValue) ? "fill-amber-400 text-amber-400" : "text-gray-200")} />
                           ))}
                         </div>
                         <span className="text-[9px] font-bold text-gray-400 ml-0.5">({product.reviewsCount || '35'})</span>
                      </div>
                   </div>
                   <div className="flex justify-between items-center mt-2">
                      <div className="flex flex-col"><div className="text-2xl font-black text-gray-900 italic tracking-tighter leading-none">₹ {(currentPrice || 0).toFixed(0)}</div></div>
                      <button onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }} className={cn("p-2 rounded-xl bg-gray-50 transition-none active:scale-75", liked ? "text-primary shadow-inner" : "text-gray-300")}><Heart className={cn("h-5 w-5", liked && "fill-primary")} /></button>
                   </div>
                </div>
             </div>
          </div>

          {!scheduleOpen && vendor && (
             <div className="px-6 pb-2">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                   <div className="bg-amber-500 p-2 rounded-lg text-white"><Clock className="h-4 w-4" /></div>
                   <div>
                      <p className="text-[10px] font-black text-amber-700 uppercase tracking-tighter">STORE IS CLOSED</p>
                      <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest leading-relaxed mt-0.5">Schedule: {vendor.openingTime} - {vendor.closingTime}. Abhi orders nahi liye ja rahe.</p>
                   </div>
                </div>
             </div>
          )}

          {isClosedMode && (
             <div className="px-6 pb-2">
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
                   <div className="bg-red-500 p-2 rounded-lg"><AlertCircle className="h-4 w-4 text-white" /></div>
                   <div>
                      <p className="text-[10px] font-black text-red-600 uppercase tracking-tighter">SALE IS CLOSED</p>
                      <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest leading-relaxed mt-0.5">Our first 10 orders have been completed, so sale is closed.</p>
                   </div>
                </div>
             </div>
          )}

          <div className="px-6 py-2">
            {product.description && <p className="text-[11px] font-medium text-muted-foreground leading-relaxed italic line-clamp-3">{product.description}</p>}
          </div>

          <div className="px-6 py-4 space-y-5">
            {hasOptions ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between"><h4 className="text-base font-black uppercase tracking-tighter text-gray-800">Addons</h4>{product.isVarietyRequired ? (<span className="text-[8px] font-black uppercase text-white bg-primary px-2 py-0.5 rounded-full animate-pulse">Required</span>) : (<span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-full italic">Optional</span>)}</div>
                <div className="space-y-2">
                  {product.options.map((opt: any, idx: number) => {
                    const isSelected = selectedOption?.name === opt.name;
                    return (
                      <button key={idx} disabled={isOffline} onClick={() => setSelectedOption(isSelected ? null : opt)} className={cn("w-full flex items-center justify-between p-4 rounded-[1.25rem] border-2 transition-none active:scale-[0.98]", isSelected ? "border-primary bg-primary/5 shadow-inner" : "border-gray-50 bg-gray-50/50")}>
                         <div className="flex items-center gap-3"><div className={cn("h-5 w-5 rounded-lg border-2 flex items-center justify-center transition-none", isSelected ? "border-primary bg-primary" : "border-gray-300 bg-white")}>{isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}</div><span className="text-sm font-black uppercase italic text-gray-700 tracking-tight">{opt.name}</span></div>
                         <span className="text-sm font-black text-gray-400 italic">₹ {opt.price.toFixed(2)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (!isMedical && (<div className="space-y-3"><div className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-primary" /><h4 className="text-sm font-black uppercase tracking-widest text-gray-800">Special Instructions</h4></div><Textarea disabled={isOffline} placeholder="E.g. Don't add onion, make it extra spicy..." value={instructions} onChange={(e) => setInstructions(e.target.value)} className="rounded-[1.25rem] bg-gray-50 border-none focus-visible:ring-1 focus-visible:ring-primary/20 font-medium text-xs min-h-[100px] p-4" /></div>))}
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100 pb-10 z-[12000] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
             <div className="flex items-center gap-3 max-w-md mx-auto">
                <div className={cn("flex items-center bg-muted/30 rounded-xl h-12 px-1.5 border border-gray-100 shadow-sm", isOffline && "opacity-50")}>
                   <button disabled={isOffline} onClick={() => setLocalQuantity(Math.max(1, localQuantity - 1))} className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-white transition-none"><Minus className="h-4 w-4" /></button>
                   <span className="w-8 text-center text-base font-black italic">{localQuantity}</span>
                   <button disabled={isOffline} onClick={() => setLocalQuantity(localQuantity + 1)} className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-white transition-none"><Plus className="h-4 w-4" /></button>
                </div>
                <Button onClick={handleAddToCart} disabled={isOffline} className="flex-1 h-12 bg-primary text-white rounded-xl font-black uppercase italic text-[11px] tracking-tighter shadow-lg shadow-primary/20 active:scale-95 transition-none disabled:bg-gray-300 disabled:shadow-none">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  {isOffline ? (scheduleOpen ? 'OFFLINE' : 'TIMING CLOSED') : `ADD • ₹${(currentPrice * localQuantity).toFixed(0)}`}
                </Button>
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}