
'use client';

import React, { useMemo, useState, useEffect, memo } from 'react';
import { MapPin, Star, Award, Timer, Plus, Heart, Store as StoreIcon, Loader2 } from 'lucide-react';
import { cn, slugify } from '@/lib/utils';
import Image from 'next/image';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit, orderBy, where } from 'firebase/firestore';
import { isStoreScheduleOpen } from '@/components/home/PopularProducts';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { ProductQuickView } from '@/components/product/ProductQuickView';
import { useCart } from '@/components/cart/CartProvider';
import { Skeleton } from '@/components/ui/skeleton';

const ProductStripItem = memo(({ product, isOffline }: any) => {
  const { cart } = useCart();
  const quantity = cart.find(c => String(c.id) === String(product.id) && !c.selectedOption)?.quantity || 0;
  const displayPrice = Number(product.price) || 0;
  const mrp = Number(product.mrp) || displayPrice + 15;

  return (
    <div 
      onClick={(e) => e.stopPropagation()} 
      className={cn("min-w-[140px] max-w-[140px] flex flex-col group/item transition-opacity duration-300", isOffline && "opacity-60")}
      style={{ contain: 'layout paint' }}
    >
       <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-muted mb-2 border border-black/[0.03]">
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" unoptimized decoding="async" loading="lazy" />
          <div className="absolute top-2 left-2">
             <Badge className="bg-[#15803d] text-white border-none font-bold text-[7px] px-2 py-0.5 rounded-lg uppercase shadow-sm">Popular</Badge>
          </div>
          <ProductQuickView product={product} vendorScheduleOpen={!isOffline}>
             <button onClick={(e) => e.stopPropagation()} className="absolute bottom-2 right-2 h-8 w-8 bg-white text-primary rounded-full flex items-center justify-center shadow-xl active:scale-75 transition-transform z-20">
                {quantity > 0 ? <span className="text-[10px] font-black text-primary">{quantity}</span> : <Plus className="h-4 w-4 stroke-[4]" />}
             </button>
          </ProductQuickView>
       </div>
       <div className="space-y-0.5 px-1 text-left">
          <div className="flex items-center gap-1 mb-1">
             <div className="h-2.5 w-2.5 border border-green-600 rounded-sm flex items-center justify-center p-0.5 shrink-0"><div className="h-full w-full bg-green-600 rounded-full" /></div>
             <h4 className="text-[11px] font-black text-gray-800 uppercase italic truncate tracking-tight">{product.name}</h4>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-[9px] font-bold text-gray-400 line-through">₹{mrp}</span>
             <Badge className="bg-rose-50 text-rose-600 border-none font-black text-[11px] italic px-2 py-0.5 rounded-lg">₹{displayPrice}</Badge>
          </div>
       </div>
    </div>
  );
});
ProductStripItem.displayName = "ProductStripItem";

export const VerticalStoreList = memo(({ 
  searchQuery = '', 
  activeMode = 'Food', 
  initialData = [], 
  initialProducts = [] 
}: { 
  searchQuery?: string, 
  activeMode?: string, 
  initialData?: any[], 
  initialProducts?: any[] 
}) => {
  const router = useRouter();
  const firestore = useFirestore();

  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [activeTown, setActiveTown] = useState<string | null>(null);
  const [currentTimeMins, setCurrentTimeMins] = useState<number | null>(null);

  useEffect(() => {
    const updateLocation = () => {
      if (typeof window !== 'undefined') {
        setActiveZoneId(localStorage.getItem('active_zone_id'));
        setActiveTown(localStorage.getItem('user_address'));
      }
    };
    updateLocation();
    window.addEventListener('user-address-updated', updateLocation);
    const d = new Date();
    setCurrentTimeMins(d.getHours() * 60 + d.getMinutes());
    return () => window.removeEventListener('user-address-updated', updateLocation);
  }, []);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'vendors'), limit(50));
  }, [firestore]);
  const { data: dbVendors, loading: vendorsLoading } = useCollection<any>(vendorsQuery, 'home_vstores_v26', initialData);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), limit(500));
  }, [firestore]);
  const { data: dbAllProducts } = useCollection<any>(productsQuery, 'home_strip_products_v36', initialProducts);

  const filteredVendors = useMemo(() => {
    const list = (dbVendors !== null && dbVendors.length > 0) ? dbVendors : initialData;
    if (!list || list.length === 0) return [];
    
    const searchLower = searchQuery.toLowerCase().trim();
    const currentMode = activeMode.toLowerCase();

    return list.filter(v => {
      if (activeZoneId) {
        const zoneMatch = v.zoneId === activeZoneId || v.zoneId === 'global';
        const townMatch = activeTown && v.town?.toLowerCase().trim() === activeTown.toLowerCase().trim();
        if (!zoneMatch && !townMatch && v.zoneId) return false;
      }
      const storeCat = (v.category || 'Food').toLowerCase();
      if (currentMode === 'medical') { if (storeCat !== 'medical') return false; }
      else if (currentMode === 'beauty') { if (storeCat !== 'beauty') return false; }
      else { if (['medical', 'beauty', 'grocery'].includes(storeCat)) return false; }
      const matchesSearch = !searchLower || v.storeName?.toLowerCase().includes(searchLower) || v.category?.toLowerCase().includes(searchLower);
      return matchesSearch && (v.status === 'approved' || !v.status);
    }).sort((a, b) => {
      const isOpenA = a.isOnline !== false && isStoreScheduleOpen(a, currentTimeMins);
      const isOpenB = b.isOnline !== false && isStoreScheduleOpen(b, currentTimeMins);
      if (isOpenA !== isOpenB) return isOpenA ? -1 : 1;
      return (Number(b.rating) || 0) - (Number(a.rating) || 0);
    });
  }, [dbVendors, initialData, activeZoneId, activeTown, searchQuery, activeMode, currentTimeMins]);

  if (vendorsLoading && (!filteredVendors || filteredVendors.length === 0)) {
    return (
      <div className="px-4 py-6 bg-white space-y-16">
        {[1, 2].map(i => (
          <div key={i} className="space-y-6"><Skeleton className="w-full aspect-[18/9] rounded-[1.5rem]" /></div>
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 py-6 bg-white scroll-gpu">
      <div className="flex items-center justify-between mb-8 px-2">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">Best <span className="text-primary">Hubs</span></h2>
        <Badge variant="outline" className="rounded-full border-gray-100 text-gray-400 font-black uppercase text-[10px]">{filteredVendors.length} STORES</Badge>
      </div>
      <div className="space-y-16">
        {filteredVendors.map((store: any) => {
            const displayImage = store.bannerUrl || store.imageUrl || `https://picsum.photos/seed/${store.id}/800/400`;
            const isOpen = isStoreScheduleOpen(store, currentTimeMins);
            const isOffline = store.isOnline === false || !isOpen;
            const productPool = (dbAllProducts !== null && dbAllProducts.length > 0) ? dbAllProducts : initialProducts;
            const storeProducts = productPool.filter((p: any) => String(p.vendorId) === String(store.id) && p.isDeleted !== true).slice(0, 8);

            const navigateToStore = () => {
              const identifier = store.slug || store.id;
              router.push(`/store/view/?id=${identifier}`);
            };

            return (
              <div key={store.id} className={cn("flex flex-col space-y-4", isOffline && "opacity-75 grayscale-[0.3]")}>
                <div onClick={navigateToStore} className="w-full text-left bg-white transition-opacity active:opacity-70 group relative cursor-pointer">
                  <div className="relative w-full aspect-[18/9] rounded-[1.5rem] overflow-hidden border border-gray-100 bg-gray-50 shadow-sm">
                    <Image src={displayImage} alt={store.storeName} fill className="object-cover" unoptimized />
                    {isOffline && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                        <span className="text-white font-black text-xl uppercase italic border-2 border-white/30 px-6 py-2 rounded-2xl shadow-xl">Closed Now</span>
                      </div>
                    )}
                  </div>
                  <div className="pt-5 px-3 flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="font-black text-2xl italic uppercase tracking-tighter text-gray-900 leading-none mb-1.5 truncate">{store.storeName}</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest italic">{store.category || 'Premium Store'}</p>
                        <span className="h-1 w-1 bg-gray-200 rounded-full" />
                        <div className="flex items-center gap-1 text-[11px] font-bold text-gray-400 italic uppercase"><MapPin className="h-3.5 w-3.5 text-primary" />{store.town || 'Local'}</div>
                      </div>
                    </div>
                    <div className="bg-[#15803d] text-white px-2.5 py-1.5 rounded-xl flex items-center gap-1 shadow-sm">
                      <span className="text-base font-black italic">{Number(store.rating || 4.0).toFixed(1)}</span><Star className="h-3 w-3 fill-white stroke-none" />
                    </div>
                  </div>
                </div>
                <div className="px-1 overflow-hidden">
                  <div className="flex overflow-x-auto space-x-4 no-scrollbar pb-4 pt-2">
                    {storeProducts.map((p: any) => <ProductStripItem key={p.id} product={{...p, restaurantName: store.storeName}} isOffline={isOffline} />)}
                    {storeProducts.length === 0 && (
                      <div className="h-24 flex items-center justify-center w-full bg-gray-50 rounded-2xl border border-dashed"><p className="text-[9px] font-black text-gray-300 uppercase">Opening Menu...</p></div>
                    )}
                  </div>
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );
});
VerticalStoreList.displayName = "VerticalStoreList";
