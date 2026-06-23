"use client"

import React, { useMemo, useState, useEffect, memo, useTransition } from "react"
import { Zap, Plus, Minus, Heart, SlidersHorizontal, Utensils, ShoppingBag, Loader2, Star, Clock, Sparkles, AlertCircle } from "lucide-react"
import { useCart } from "@/components/cart/CartProvider"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, limit, doc } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { ProductQuickView } from "@/components/product/ProductQuickView"
import { Badge } from "@/components/ui/badge"

const ProductItem = memo(({ product, vendor, quantity, onAdd, onRemove, onToggleWishlist, isLiked, onNavigate, globalOffer }: any) => {
  const isOffline = (vendor?.isOnline === false) || (product.isAvailable === false);
  const imageUrl = product.imageUrl || `https://picsum.photos/seed/${product.id}/400/300`;

  // SHOWOFF PRICE: Always show discount on Home page for attraction if sale is active
  const basePrice = product.price || 0;
  const isSaleActive = globalOffer?.isActive;
  
  const showoffPrice = useMemo(() => {
    if (!isSaleActive) return basePrice;
    const val = Number(globalOffer.value) || 0;
    if (globalOffer.type === 'percentage') return basePrice * (1 - val / 100);
    return Math.max(0, basePrice - val);
  }, [basePrice, globalOffer]);

  const handleQuickAdd = () => {
    if (isOffline) return;
    
    // REAL PRICE CALCULATION: Depends on if the milestone toggle is ON (Showoff) or OFF (Real)
    // If isClosedAfterMilestone is true, we must use the basePrice even if sale is active
    const isRealSale = isSaleActive && !globalOffer?.isClosedAfterMilestone;
    const finalPrice = isRealSale ? showoffPrice : basePrice;

    onAdd({ 
      ...product, 
      imageUrl, 
      price: finalPrice,
      originalPrice: basePrice 
    });
  };

  return (
    <div className={cn(
      "relative bg-white rounded-[2rem] border border-gray-100 transition-all duration-300 will-change-transform transform-gpu p-6 flex justify-between items-start shadow-sm hover:shadow-md",
      isOffline && "opacity-60 grayscale-[0.5]"
    )}>
      <div className="flex-1 pr-4 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-3.5 w-3.5 border-2 border-green-600 rounded-sm flex items-center justify-center p-0.5"><div className="h-full w-full bg-green-600 rounded-full" /></div>
          {isSaleActive && (
            <Badge className="bg-primary text-white text-[7px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse border-none">
              FLASH SALE LIVE
            </Badge>
          )}
        </div>
        <div onClick={() => !isOffline && onNavigate(product.id)} className={cn("block text-left w-full cursor-pointer", isOffline && "pointer-events-none")}>
          <h3 className="font-bold text-lg text-[#1C1C1C] mb-1.5 italic tracking-tight line-clamp-2 uppercase">{product.name}</h3>
          <div className="flex items-baseline gap-2 mb-2">
             <div className="text-xl font-black text-primary italic">₹{showoffPrice.toFixed(0)}</div>
             {isSaleActive && <div className="text-xs font-bold text-gray-400 line-through">₹{basePrice}</div>}
          </div>
          
          <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-60">from {product.restaurantName || 'Nearby'}</p>
        </div>
      </div>
      <div className="relative w-28 h-28 shrink-0">
        <div onClick={() => !isOffline && onNavigate(product.id)} className="relative w-full h-full rounded-2xl overflow-hidden bg-muted shadow-inner cursor-pointer transform-gpu">
          <Image src={imageUrl} alt={product.name} fill className="object-cover" unoptimized loading="lazy" />
          {isOffline && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-3 text-center transition-opacity animate-in fade-in duration-300">
              <span className="text-white font-black text-[10px] uppercase italic tracking-tighter border-2 border-white/30 px-2 py-1 rounded-lg backdrop-blur-sm">Closed</span>
            </div>
          )}
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-full px-1.5 z-20">
          {quantity === 0 ? (
            <ProductQuickView product={product} globalOffer={globalOffer}>
              <button disabled={isOffline} className={cn("w-full h-9 bg-white shadow-lg font-black text-[9px] uppercase rounded-xl transition-all active:scale-95", isOffline ? "text-gray-300 border-2 border-gray-200" : "text-primary border-2 border-primary")}>
                {isOffline ? 'OFF' : 'ADD'}
              </button>
            </ProductQuickView>
          ) : (
            <div className={cn("flex items-center justify-between w-full h-9 bg-primary text-white rounded-xl shadow-lg", isOffline && "opacity-50")}>
              <button onClick={() => onRemove(product.id)} className="flex-1 flex items-center justify-center h-full"><Minus className="h-3 w-3" /></button>
              <span className="text-xs font-black min-w-[20px] text-center">{quantity}</span>
              <button disabled={isOffline} onClick={() => !isOffline && handleQuickAdd()} className="flex-1 flex items-center justify-center h-full"><Plus className="h-3.5 w-3.5" /></button>
            </div>
          )}
        </div>
        <button onClick={() => onToggleWishlist(product.id)} className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 shadow-md z-20 active:scale-75 transition-transform">
          <Heart className={cn("h-3.5 w-3.5", isLiked ? "fill-primary text-primary" : "text-gray-300")} />
        </button>
      </div>
    </div>
  );
});
ProductItem.displayName = "ProductItem";

function ProductSkeleton() {
  return (
    <div className="relative bg-white rounded-[2rem] border border-gray-100 p-6 flex justify-between items-start shadow-sm animate-pulse h-[160px]">
      <div className="flex-1 pr-4">
        <div className="h-3 w-3 bg-gray-200 rounded-sm mb-3" />
        <div className="h-6 w-3/4 bg-gray-100 rounded-md mb-2" />
        <div className="h-4 w-1/4 bg-gray-100 rounded-md mb-4" />
        <div className="h-3 w-1/2 bg-gray-50 rounded-md" />
      </div>
      <div className="w-28 h-28 bg-gray-100 rounded-2xl" />
    </div>
  );
}

export function PopularProducts({ searchQuery = '', category = 'all', activeMode = 'Food' }: { searchQuery?: string, category?: string, activeMode?: string }) {
  const { cart, addToCart, removeFromCart, toggleWishlist, isInWishlist } = useCart();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    const updateZone = () => {
      setActiveZoneId(localStorage.getItem('active_zone_id'));
      setActiveCity(localStorage.getItem('user_city'));
    };
    updateZone();
    window.addEventListener('user-address-updated', updateZone);
    return () => window.removeEventListener('user-address-updated', updateZone);
  }, []);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), limit(500));
  }, [firestore]);

  const { data: dbProducts, loading: productsLoading } = useCollection<any>(productsQuery);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);
  const { data: vendors } = useCollection<any>(vendorsQuery);

  // Global Offer Hook
  const offerRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'global_offer');
  }, [firestore]);
  const { data: globalOffer } = useDoc<any>(offerRef);

  const vendorMap = useMemo(() => {
    const map = new Map();
    if (vendors) vendors.forEach(v => map.set(v.id, v));
    return map;
  }, [vendors]);

  const cartMap = useMemo(() => {
    const map = new Map();
    if (cart) cart.forEach(item => map.set(item.id, item.quantity));
    return map;
  }, [cart]);

  const productsToDisplay = useMemo(() => {
    if (!dbProducts) return [];
    const searchLower = searchQuery.toLowerCase().trim();
    const categoryLower = category.toLowerCase().trim();
    const targetCityNormalized = (activeCity || '').toLowerCase().trim();

    return dbProducts.filter(product => {
      const vendor = vendorMap.get(product.vendorId);
      const productMode = product.serviceMode || vendor?.category || 'Food';
      if (productMode !== activeMode) return false;

      const productTown = (product.town || vendor?.town || '').toLowerCase().trim();
      if (activeZoneId || targetCityNormalized) {
        if (targetCityNormalized === 'ranipur' && productTown === 'mauranipur') return false;
        if (targetCityNormalized === 'mauranipur' && productTown === 'ranipur') return false;
      }

      const matchesSearch = !searchLower || product.name?.toLowerCase().includes(searchLower) || product.category?.toLowerCase().includes(searchLower);
      const matchesCategory = categoryLower === 'all' || product.category?.toLowerCase().trim() === categoryLower;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => {
      const vA = vendorMap.get(a.vendorId);
      const vB = vendorMap.get(b.vendorId);
      const onlineA = (vA?.isOnline !== false && a.isAvailable !== false) ? 1 : 0;
      const onlineB = (vB?.isOnline !== false && b.isAvailable !== false) ? 1 : 0;
      return onlineB - onlineA;
    });
  }, [searchQuery, category, dbProducts, vendorMap, activeZoneId, activeCity, activeMode]);

  const navigateToProduct = (id: string) => {
    startTransition(() => {
      router.push(`/product/view?id=${id}`);
    });
  };

  if (productsLoading && (!dbProducts || dbProducts.length === 0)) {
    return (
      <div className="px-4 py-8 space-y-6">
        <ProductSkeleton />
        <ProductSkeleton />
        <ProductSkeleton />
      </div>
    );
  }

  return (
    <div className="px-4 py-8 content-visibility-auto transform-gpu">
      <div className="flex items-center justify-between mb-8 px-2">
        <h2 className="text-sm font-black tracking-tight text-[#1C1C1C] uppercase italic">{searchQuery ? 'Results' : `⚡ ${activeMode.toUpperCase()} HUB`}</h2>
      </div>
      <div className={cn("grid grid-cols-1 gap-8 transition-opacity duration-200", isPending && "opacity-50")}>
        {productsToDisplay.map((product) => (
          <ProductItem 
            key={product.id}
            product={product}
            vendor={vendorMap.get(product.vendorId)}
            quantity={cartMap.get(product.id) || 0}
            onAdd={addToCart}
            onRemove={removeFromCart}
            onToggleWishlist={toggleWishlist}
            isLiked={isInWishlist(product.id)}
            onNavigate={navigateToProduct}
            globalOffer={globalOffer}
          />
        ))}
        {productsToDisplay.length === 0 && !productsLoading && (
          <div className="text-center py-20 opacity-30">
            <ShoppingBag className="h-16 w-16 mx-auto mb-4" />
            <p className="font-black italic uppercase tracking-widest text-sm">No Items Found</p>
          </div>
        )}
      </div>
    </div>
  );
}
