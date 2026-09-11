"use client"

import { useParams, useRouter } from 'next/navigation';
import { useCart } from '@/components/cart/CartProvider';
import { ChevronLeft, Minus, Plus, Share2, Loader2, Zap, ListTree } from 'lucide-react';
import Image from 'next/image';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn, slugify } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, useDoc, useUser } from '@/firebase';
import { collection, query, where, limit, doc, getDoc, getDocs } from 'firebase/firestore';

/**
 * @fileOverview ProductDetailsClient with enhanced Variety Selection logic.
 */
export default function ProductDetailsClient({ forcedSlug }: { forcedSlug?: string }) {
  const params = useParams();
  const rawSlug = forcedSlug || (params?.slug as string);
  const router = useRouter();
  const { toast } = useToast();
  const { cart, addToCart } = useCart();
  const { user } = useUser();
  
  const [localQuantity, setLocalQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState<{ name: string; price: number } | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const firestore = useFirestore();

  useEffect(() => {
    async function resolveProduct() {
      if (!firestore || !rawSlug) return;
      setLoading(true);
      try {
        const slugQ = query(collection(firestore, 'products'), where('slug', '==', rawSlug), limit(1));
        const slugSnap = await getDocs(slugQ);

        if (!slugSnap.empty) {
          setProduct({ id: slugSnap.docs[0].id, ...slugSnap.docs[0].data() });
          setLoading(false);
          return;
        }

        const idRef = doc(firestore, 'products', rawSlug);
        const idSnap = await getDoc(idRef);
        if (idSnap.exists()) {
          setProduct({ id: idSnap.id, ...idSnap.data() });
          setLoading(false);
          return;
        }

        const parts = rawSlug.split('-');
        const possibleId = parts[parts.length - 1];
        if (possibleId && possibleId.length > 10) {
          const fallbackRef = doc(firestore, 'products', possibleId);
          const fallbackSnap = await getDoc(fallbackRef);
          if (fallbackSnap.exists()) {
            setProduct({ id: fallbackSnap.id, ...fallbackSnap.data() });
          }
        }
      } catch (err) {
        console.error("Resolution error:", err);
      } finally {
        setLoading(false);
      }
    }
    resolveProduct();
  }, [firestore, rawSlug]);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);
  const { data: vendors } = useCollection<any>(vendorsQuery);

  const offerRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'global_offer');
  }, [firestore]);
  const { data: globalOffer } = useDoc<any>(offerRef);

  const vendor = vendors?.find(v => v.id === product?.vendorId);
  const isOffline = (vendor?.isOnline === false) || (product?.isAvailable === false);

  const isSaleActive = globalOffer?.isActive;
  const isClosedMode = isSaleActive && globalOffer?.isClosedAfterMilestone === true;

  const currentPrice = useMemo(() => {
    if (!product) return 0;
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

  const totalPrice = useMemo(() => currentPrice * localQuantity, [currentPrice, localQuantity]);

  const handleAddToCart = () => {
    if (!product || isOffline) return;
    if (!user) {
      window.dispatchEvent(new CustomEvent('open-auth-overlay'));
      return;
    }

    if (product.isVarietyRequired && !selectedOption) {
      toast({ variant: "destructive", title: "Pick a Variety", description: "Please select an option to add this item." });
      return;
    }

    const imageUrl = product.imageUrl || `https://picsum.photos/seed/${product.id}/800/600`;
    addToCart({ ...product, imageUrl, quantity: localQuantity, selectedOption, price: currentPrice });
    toast({ title: "Added to Cart" });
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!product && !loading) return <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center"><h2 className="text-xl font-black italic uppercase text-muted-foreground">Item Not Found</h2><Button onClick={() => router.push('/')} className="mt-8 bg-black rounded-xl">Back to Home</Button></div>;

  return (
    <div className="min-h-screen bg-white pb-40">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center border-b border-border/50">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"><ChevronLeft className="h-6 w-6" /></button>
        <h1 className="flex-1 text-center text-lg font-black uppercase italic tracking-tight">Details</h1>
        <button className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-muted text-foreground"><Share2 className="h-5 w-5" /></button>
      </div>

      <div className={cn("relative w-full aspect-[4/3] bg-muted", isOffline && "grayscale")}>
        <Image src={product?.imageUrl} alt={product?.name || 'Product'} fill className="object-cover" priority unoptimized />
      </div>

      <div className="relative z-10 -mt-8 bg-white rounded-t-[2.5rem] px-6 pt-8 pb-4">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-2xl font-black text-foreground leading-tight uppercase italic">{product?.name}</h2>
          {product?.isVeg && <div className="h-6 w-6 border-2 border-green-600 rounded-sm flex items-center justify-center p-0.5 mt-1"><div className="h-full w-full bg-green-600 rounded-full" /></div>}
        </div>

        <div className="flex items-baseline gap-3 mb-4">
           <div className="text-3xl font-black text-gray-900 italic">₹{(currentPrice || 0).toFixed(0)}</div>
           {isSaleActive && <div className="text-sm font-bold text-gray-400 line-through">₹{product?.price}</div>}
        </div>

        <p className="text-sm font-medium text-muted-foreground leading-relaxed mb-8 italic">{product?.description}</p>

        {/* VARIETY SELECTION UI - ENHANCED */}
        {product?.options && product.options.length > 0 && (
          <div className="space-y-5 mb-10 animate-in fade-in duration-500 bg-[#0B0B0B] p-6 rounded-[2.5rem] border border-white/5">
             <div className="flex items-center gap-2">
                <ListTree className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 italic">Select Preference {product.isVarietyRequired && <span className="text-primary">*</span>}</span>
             </div>
             <div className="grid grid-cols-1 gap-3">
                {product.options.map((opt: any, idx: number) => (
                  <button 
                    key={idx}
                    onClick={() => setSelectedOption(opt)}
                    className={cn(
                      "flex items-center justify-between p-5 rounded-[1.75rem] border-2 transition-all active:scale-[0.98]",
                      selectedOption?.name === opt.name ? "border-primary bg-primary/10" : "border-white/5 bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-4">
                       <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center", selectedOption?.name === opt.name ? "border-primary" : "border-white/20")}>
                          {selectedOption?.name === opt.name && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                       </div>
                       <span className={cn("text-sm font-black uppercase italic tracking-widest", selectedOption?.name === opt.name ? "text-white" : "text-gray-400")}>{opt.name}</span>
                    </div>
                    <span className="text-base font-black italic text-primary">+ ₹ {opt.price}</span>
                  </button>
                ))}
             </div>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 z-[11000] bg-white border-t border-border/50 p-4 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-4 max-w-lg mx-auto">
            <div className="flex items-center bg-muted/50 rounded-2xl h-14 px-2">
              <button onClick={() => setLocalQuantity(Math.max(1, localQuantity - 1))} className="h-10 w-10 flex items-center justify-center"><Minus className="h-4 w-4" /></button>
              <span className="w-10 text-center text-lg font-black">{localQuantity}</span>
              <button onClick={() => setLocalQuantity(localQuantity + 1)} className="h-10 w-10 flex items-center justify-center"><Plus className="h-4 w-4" /></button>
            </div>
            <button 
              onClick={handleAddToCart} 
              disabled={isOffline || (product?.isVarietyRequired && !selectedOption)}
              className="flex-1 h-14 rounded-2xl bg-primary text-white font-black uppercase italic shadow-lg active:scale-95 transition-all"
            >
              {isOffline ? 'OFFLINE' : (product?.isVarietyRequired && !selectedOption) ? 'PICK OPTION' : `Add • ₹${totalPrice.toFixed(0)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
