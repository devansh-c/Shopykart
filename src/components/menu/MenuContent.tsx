
"use client"

import { useState, useMemo, useEffect, memo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Clock, MapPin, Loader2, Store, Plus, Heart, ShoppingBag, ArrowLeft, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/components/cart/CartProvider';
import { cn, slugify } from '@/lib/utils';
import Image from 'next/image';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, doc, getDoc, getDocs } from 'firebase/firestore';
import { ProductQuickView } from '@/components/product/ProductQuickView';
import { isStoreScheduleOpen } from '@/components/home/PopularProducts';
import { Skeleton } from '@/components/ui/skeleton';

const ProductHorizontalItem = memo(({ product, isOffline }: any) => {
  const { cart } = useCart();
  const quantity = cart.find(c => String(c.id) === String(product.id) && !c.selectedOption)?.quantity || 0;
  const displayPrice = Number(product.price) || 0;
  const mrp = Number(product.mrp) || displayPrice + 15;

  return (
    <div className={cn("min-w-[160px] max-w-[160px] flex flex-col group/item transition-all animate-in fade-in zoom-in duration-300", isOffline && "opacity-60")}>
       <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-muted mb-2 border border-black/[0.03]">
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover group-hover/item:scale-105 transition-transform duration-500" unoptimized />
          <div className="absolute top-2 left-2">
             <Badge className="bg-[#15803d] text-white border-none font-bold text-[7px] px-2 py-0.5 rounded-lg uppercase shadow-sm">Popular</Badge>
          </div>
          <ProductQuickView product={product} vendorScheduleOpen={!isOffline}>
             <button className="absolute bottom-2 right-2 h-9 w-9 bg-white text-primary rounded-full flex items-center justify-center shadow-xl active:scale-75 transition-transform z-20">
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
ProductHorizontalItem.displayName = "ProductHorizontalItem";

export default function MenuContent({ forcedSlug, initialVendor, initialProducts = [] }: { forcedSlug?: string, initialVendor?: any, initialProducts?: any[] }) {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const rawSlug = useMemo(() => {
    const fromProps = forcedSlug;
    const fromSearch = searchParams.get('id');
    const fromParams = params?.slug ? String(params.slug) : null;
    const final = (fromProps || fromSearch || fromParams || '').trim();
    // Capacitor/Android often adds "view" slug when using search params
    return (final === 'view' || final === 'details') ? (fromSearch || '') : final;
  }, [forcedSlug, params, searchParams]);

  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMinutes, setCurrentMinutes] = useState<number | null>(null);
  const [vendorProfile, setVendorProfile] = useState<any>(initialVendor);
  const [vendorLoading, setVendorLoading] = useState(true);
  
  const firestore = useFirestore();

  useEffect(() => {
    const syncTime = () => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    };
    syncTime();
    const interval = setInterval(syncTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const resolveVendor = async () => {
    if (!firestore || !rawSlug) {
      setVendorLoading(false);
      return;
    }

    setVendorLoading(true);
    try {
      const cleanSlug = String(rawSlug).toLowerCase().trim();

      // STAGE 1: Direct ID Match (Fastest)
      const idRef = doc(firestore, 'vendors', rawSlug);
      const idSnap = await getDoc(idRef);
      if (idSnap.exists()) {
        setVendorProfile({ id: idSnap.id, ...idSnap.data() });
        setVendorLoading(false);
        return;
      }

      // STAGE 2: Query Slug or storeId (Precise)
      const vendorsRef = collection(firestore, 'vendors');
      const [slugSnap, idQuerySnap] = await Promise.all([
        getDocs(query(vendorsRef, where('slug', '==', cleanSlug), limit(1))),
        getDocs(query(vendorsRef, where('storeId', '==', cleanSlug), limit(1)))
      ]);

      if (!slugSnap.empty) {
        setVendorProfile({ id: slugSnap.docs[0].id, ...slugSnap.docs[0].data() });
        setVendorLoading(false);
        return;
      }

      if (!idQuerySnap.empty) {
        setVendorProfile({ id: idQuerySnap.docs[0].id, ...idQuerySnap.docs[0].data() });
        setVendorLoading(false);
        return;
      }

      // STAGE 3: Aggressive Full Scan (Fallback for slow internet/desync)
      const allVendors = await getDocs(vendorsRef);
      const found = allVendors.docs.find(d => {
        const data = d.data();
        const vendorId = d.id.toLowerCase();
        const vendorSlug = (data.slug || '').toLowerCase();
        const vendorStoreId = (data.storeId || '').toLowerCase();
        const vendorNameSlug = slugify(data.storeName || '').toLowerCase();

        return vendorId === cleanSlug || 
               vendorSlug === cleanSlug || 
               vendorStoreId === cleanSlug ||
               vendorNameSlug === cleanSlug;
      });

      if (found) {
        setVendorProfile({ id: found.id, ...found.data() });
      }
      
      setVendorLoading(false);
    } catch (err) {
      console.error("Critical Resolution Error:", err);
      setVendorLoading(false);
    }
  };

  useEffect(() => {
    resolveVendor();
  }, [firestore, rawSlug]);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !vendorProfile) return null;
    return query(collection(firestore, 'products'), where('vendorId', '==', String(vendorProfile.id)));
  }, [firestore, vendorProfile]);
  
  const { data: dbProducts, loading: productsLoading } = useCollection<any>(productsQuery, `menu_v13_${vendorProfile?.id}`, initialProducts);

  const categoriesWithProducts = useMemo(() => {
    const list = (dbProducts && dbProducts.length > 0) ? dbProducts : initialProducts;
    if (!list || list.length === 0) return [];
    
    const filtered = list.filter((product: any) => {
      if (product.isDeleted) return false;
      const matchesSearch = (product.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });

    const groups: { [key: string]: any[] } = {};
    filtered.forEach(p => {
      const cat = p.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });

    return Object.entries(groups).map(([name, items]) => ({
      name,
      items: items.sort((a, b) => (Number(a.price) - Number(b.price)))
    }));
  }, [searchQuery, dbProducts, initialProducts]);

  const scheduleOpen = useMemo(() => isStoreScheduleOpen(vendorProfile, currentMinutes), [vendorProfile, currentMinutes]);
  const isOffline = vendorProfile?.isOnline === false || !scheduleOpen;

  if (vendorLoading && !vendorProfile) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center gap-4">
        <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 animate-pulse">
           <Store className="h-8 w-8 text-primary" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Syncing Hub...</p>
      </div>
    );
  }

  if (!vendorProfile && !vendorLoading) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
        <div className="bg-muted/30 h-28 w-28 rounded-full flex items-center justify-center mb-10">
           <Store className="h-14 w-14 text-muted-foreground/30" />
        </div>
        <h2 className="text-3xl font-black italic uppercase text-gray-800 tracking-tighter leading-tight">HUB OFFLINE</h2>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-4 mb-10">Network connection lost. Please try again.</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button onClick={() => resolveVendor()} className="h-16 bg-primary text-white rounded-2xl font-black uppercase italic shadow-xl">
            <RefreshCw className="h-4 w-4 mr-2" /> RECONNECT
          </Button>
          <Button onClick={() => router.push('/')} variant="ghost" className="h-14 text-gray-400 font-black uppercase italic">BACK TO HOME</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-40">
      <div className="relative h-72 w-full">
        <img src={vendorProfile?.bannerUrl || vendorProfile?.imageUrl || 'https://picsum.photos/seed/store/800/400'} className="w-full h-full object-cover" alt="Banner" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-6">
          <button onClick={() => router.push('/')} className="absolute top-12 left-6 h-10 w-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 active:scale-90 transition-transform"><ArrowLeft className="h-5 w-5" /></button>
          <div className="flex items-end gap-4">
            <div className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-primary shadow-xl shrink-0 bg-white">
              <img src={vendorProfile?.imageUrl} className="h-full w-full object-cover" alt="Logo" />
            </div>
            <div className="flex-1 pb-1 min-w-0 text-left">
              <h1 className="text-2xl font-black italic uppercase text-white tracking-tighter leading-none mb-2 truncate drop-shadow-lg">{vendorProfile?.storeName}</h1>
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-primary italic">
                <span className="flex items-center gap-1 shrink-0 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-white/10"><Clock className="h-3 w-3" /> {vendorProfile?.deliveryTime || '20 min'}</span>
                <span className="flex items-center gap-1 text-white/80 truncate"><MapPin className="h-3 w-3" /> {vendorProfile?.town}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 pt-12 pb-4 text-left">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">Premium Menu</h1>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">Best quality ingredients guaranteed.</p>
      </div>
      <div className="px-6 mb-8">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder='Search deliciousness...' className="pl-12 h-14 bg-gray-50 border-none rounded-2xl text-lg shadow-inner focus-visible:ring-1 focus-visible:ring-primary/20 font-bold" />
        </div>
      </div>
      <div className="space-y-12">
        {productsLoading && categoriesWithProducts.length === 0 ? (
          <div className="px-6 space-y-10">
             {[1, 2].map(i => (
               <div key={i} className="space-y-4">
                  <Skeleton className="h-6 w-32 rounded-full" />
                  <div className="flex gap-4 overflow-hidden">
                    <Skeleton className="h-40 w-40 shrink-0 rounded-2xl" />
                    <Skeleton className="h-40 w-40 shrink-0 rounded-2xl" />
                  </div>
               </div>
             ))}
          </div>
        ) : categoriesWithProducts.length > 0 ? (
          categoriesWithProducts.map((category) => (
            <div key={category.name} className="animate-in fade-in duration-700">
               <div className="px-6 mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-black italic uppercase tracking-tighter text-gray-900 border-l-4 border-primary pl-3">{category.name}</h2>
                  <Badge variant="outline" className="rounded-full border-gray-100 text-gray-400 font-black uppercase text-[8px]">{category.items.length} ITEMS</Badge>
               </div>
               <div className="px-6 overflow-x-auto no-scrollbar">
                  <div className="flex space-x-5 pb-4">
                     {category.items.map((product) => (
                       <ProductHorizontalItem key={product.id} product={{...product, restaurantName: vendorProfile.storeName}} isOffline={isOffline} />
                     ))}
                  </div>
               </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 opacity-20 flex flex-col items-center">
             <ShoppingBag className="h-16 w-16 mb-4" />
             <p className="font-black italic uppercase text-xs">No products listed in this store</p>
          </div>
        )}
      </div>
    </div>
  );
}
