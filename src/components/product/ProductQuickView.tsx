
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
  Clock,
  Timer
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/components/cart/CartProvider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
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
  const { user } = useUser();
  const firestore = useFirestore();
  const [isOpen, setIsOpen] = useState(false);
  const [localQuantity, setLocalQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState<{ name: string; price: number } | null>(null);
  const [instructions, setInstructions] = useState('');

  const vendorsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'vendors') : null, [firestore]);
  const { data: vendors } = useCollection<any>(vendorsQuery);
  const vendor = vendors?.find(v => v.id === product.vendorId);
  const scheduleOpen = vendorScheduleOpen !== undefined ? vendorScheduleOpen : isStoreScheduleOpen(vendor);
  const isOffline = (vendor?.isOnline === false) || !scheduleOpen;

  // GUEST DISCOUNT: ₹10 off if not logged in
  const displayBasePrice = !user ? Math.max(0, (product.price || 0) - 10) : (product.price || 0);

  const currentPrice = useMemo(() => {
    const base = displayBasePrice;
    const optPrice = selectedOption ? selectedOption.price : 0;
    const totalBase = base + optPrice;
    if (globalOffer?.isActive && globalOffer?.isClosedAfterMilestone !== true) {
      if (globalOffer.type === 'percentage') return totalBase * (1 - (Number(globalOffer.value) || 0) / 100);
      return Math.max(0, totalBase - (Number(globalOffer.value) || 0));
    }
    return totalBase;
  }, [displayBasePrice, selectedOption, globalOffer, user]);

  const handleAddToCart = () => {
    if (!user) { 
      setIsOpen(false); 
      window.dispatchEvent(new CustomEvent('open-auth-overlay')); 
      return; 
    }
    if (isOffline) return;
    addToCart({ ...product, imageUrl: product.imageUrl, quantity: localQuantity, selectedOption, instructions, price: currentPrice });
    setIsOpen(false); setLocalQuantity(1); setSelectedOption(null);
    toast({ title: "Added to Bag" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="rounded-t-[2.5rem] sm:rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl z-[11000] bottom-0 top-auto translate-y-0 sm:top-[50%] sm:translate-y-[-50%] focus:outline-none">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="font-black italic uppercase text-center text-xl">{product.name}</DialogTitle>
          <DialogDescription className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Customize and Add to Bag</DialogDescription>
        </DialogHeader>
        <div className="bg-white max-h-[90vh] overflow-y-auto no-scrollbar pb-32">
          <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white shadow-lg border flex items-center justify-center text-gray-400 z-50"><X className="h-4 w-4" /></button>
          <div className="p-6 pt-4 flex gap-4">
             <div className="relative h-28 w-28 rounded-2xl overflow-hidden bg-muted border shadow-sm">
                <Image src={product.imageUrl} alt={product.name} fill className="object-cover" unoptimized />
                {!user && !isOffline && <div className="absolute top-1 left-1 bg-primary text-white text-[7px] font-black px-1.5 py-0.5 rounded-full shadow-lg">₹10 OFF</div>}
             </div>
             <div className="flex-1 min-w-0">
                <h3 className="font-black text-xl text-gray-900 italic uppercase tracking-tighter leading-tight line-clamp-2">{product.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                   <p className="text-[10px] font-black text-green-600 uppercase tracking-widest italic">{product.restaurantName || 'ShopyKart Store'}</p>
                   {product.preparingTime && (
                     <Badge className="bg-green-100 text-green-700 border-none font-black text-[7px] uppercase px-1.5 py-0">
                        <Timer className="h-2 w-2 mr-1" /> READY IN {product.preparingTime}M
                     </Badge>
                   )}
                </div>
                <div className="text-2xl font-black text-gray-900 italic tracking-tighter mt-2">₹ {currentPrice.toFixed(0)}</div>
             </div>
          </div>
          <div className="px-6 py-4 space-y-4">
            {product.description && <p className="text-[11px] font-medium text-muted-foreground italic leading-relaxed">{product.description}</p>}
            {!isMedical && <Textarea disabled={isOffline} placeholder="Special instructions (e.g. no onion)..." value={instructions} onChange={e => setInstructions(e.target.value)} className="rounded-2xl bg-gray-50 border-none text-xs min-h-[100px] p-4" />}
          </div>
          <div className="fixed bottom-0 left-0 right-0 p-5 bg-white border-t pb-10 z-[12000]">
             <div className="flex items-center gap-3 max-w-md mx-auto">
                <div className="flex items-center bg-muted/30 rounded-xl h-12 px-1.5">
                   <button disabled={isOffline} onClick={() => setLocalQuantity(Math.max(1, localQuantity - 1))} className="h-9 w-9 flex items-center justify-center"><Minus className="h-4 w-4" /></button>
                   <span className="w-8 text-center text-base font-black italic">{localQuantity}</span>
                   <button disabled={isOffline} onClick={() => setLocalQuantity(localQuantity + 1)} className="h-9 w-9 flex items-center justify-center"><Plus className="h-4 w-4" /></button>
                </div>
                <Button onClick={handleAddToCart} className="flex-1 h-12 bg-primary text-white rounded-xl font-black uppercase italic text-[11px] shadow-lg shadow-primary/20">
                  {isOffline ? 'TIMING CLOSED' : `ADD • ₹${(currentPrice * localQuantity).toFixed(0)}`}
                </Button>
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
