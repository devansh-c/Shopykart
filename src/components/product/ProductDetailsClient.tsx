
"use client"

import { useParams, useRouter } from 'next/navigation';
import { useCart } from '@/components/cart/CartProvider';
import { ChevronLeft, Minus, Plus, Share2, Loader2, Zap } from 'lucide-react';
import Image from 'next/image';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn, slugify } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, useDoc, useUser } from '@/firebase';
import { collection, query, where, limit, doc, getDoc, getDocs } from 'firebase/firestore';

/**
 * @fileOverview ProductDetailsClient with High-Performance Resolution logic.
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
        // 1. Try finding by 'slug' field in Firestore
        const slugQ = query(collection(firestore, 'products'), where('slug', '==', rawSlug), limit(1));
        const slugSnap = await getDocs(slugQ);

        if (!slugSnap.empty) {
          setProduct({ id: slugSnap.docs[0].id, ...slugSnap.docs[0].data() });
          setLoading(false);
          return;
        }

        // 2. Try finding by Document ID (Legacy/Direct)
        const idRef = doc(firestore, 'products', rawSlug);
        const idSnap = await getDoc(idRef);
        if (idSnap.exists()) {
          setProduct({ id: idSnap.id, ...idSnap.data() });
          setLoading(false);
          return;
        }

        // 3. Fallback for legacy slug format (name-id)
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

  const productSchema = useMemo(() => {
    if (!product) return null;
    return {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "image": [product.imageUrl],
      "description": product.description || `Fresh and delicious ${product.name} from ShopyKart.`,
      "sku": product.id,
      "brand": { "@type": "Brand", "name": "ShopyKart" },
      "offers": {
        "@type": "Offer",
        "url": `https://shopykart.co.in/product/${product.slug || product.id}`,
        "priceCurrency": "INR",
        "price": currentPrice,
        "availability": isOffline ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        "seller": { "@type": "Organization", "name": product.restaurantName || "ShopyKart" }
      }
    };
  }, [product, currentPrice, isOffline]);

  const handleAddToCart = () => {
    if (!product || isOffline) return;
    if (!user) {
      window.dispatchEvent(new CustomEvent('open-auth-overlay'));
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
      {productSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      )}

      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center border-b border-border/50">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"><ChevronLeft className="h-6 w-6" /></button>
        <h1 className="flex-1 text-center text-lg font-black uppercase italic tracking-tight">Details</h1>
        <button onClick={() => {}} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-muted text-foreground"><Share2 className="h-5 w-5" /></button>
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

        <p className="text-sm font-medium text-muted-foreground leading-relaxed mb-6 italic">{product?.description}</p>

        <div className="fixed bottom-0 left-0 right-0 z-[11000] bg-white border-t border-border/50 p-4 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-4 max-w-lg mx-auto">
            <div className="flex items-center bg-muted/50 rounded-2xl h-14 px-2">
              <button onClick={() => setLocalQuantity(Math.max(1, localQuantity - 1))} className="h-10 w-10 flex items-center justify-center"><Minus className="h-4 w-4" /></button>
              <span className="w-10 text-center text-lg font-black">{localQuantity}</span>
              <button onClick={() => setLocalQuantity(localQuantity + 1)} className="h-10 w-10 flex items-center justify-center"><Plus className="h-4 w-4" /></button>
            </div>
            <button onClick={handleAddToCart} className="flex-1 h-14 rounded-2xl bg-primary text-white font-black uppercase italic shadow-lg active:scale-95 transition-all">
              {isOffline ? 'OFFLINE' : `Add • ₹${totalPrice.toFixed(0)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
