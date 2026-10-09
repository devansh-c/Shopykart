"use client"

import { useState, useMemo, useEffect, memo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Clock, MapPin, Loader2, Store, Plus, Heart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/components/cart/CartProvider';
import { cn, slugify } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, doc, getDoc, getDocs } from 'firebase/firestore';
import { ProductQuickView } from '@/components/product/ProductQuickView';
import { isStoreScheduleOpen } from '@/components/home/PopularProducts';

/**
 * @fileOverview Product Horizontal Item for Menu Page.
 */
const ProductHorizontalItem = memo(({ product, isOffline }: any) => {
  const { cart } = useCart();
  const quantity = cart.find(c => String(c.id) === String(product.id) && !c.selectedOption)?.quantity || 0;
  const displayPrice = Number(product.price) || 0;
  const mrp = Number(product.mrp) || displayPrice + 15;
  const discount = Math.round(((mrp - displayPrice) / (mrp || 1)) * 100);

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
          
          <p className="text-[8px] font-black text-[#D946EF] uppercase italic tracking-tighter flex items-center gap-1 mt-1 animate-pulse">
             <Heart className="h-2 w-2 fill-[#D946EF]" /> Our app: {discount > 0 ? discount : '40'}% lower
          </p>
       </div>
    </div>
  );
});
ProductHorizontalItem.displayName = "ProductHorizontalItem";

export default function MenuContent({ forcedSlug }: { forcedSlug?: string }) {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawSlug = forcedSlug || (params?.slug as string) || searchParams.get('id');
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMinutes, setCurrentMinutes] = useState<number | null>(null);
  const [vendorProfile, setVendorProfile] = useState<any>(null);
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

  useEffect(() => {
    async function resolveVendor() {
      if (!firestore || !rawSlug) {
        setVendorLoading(false);
        return;
      }
      setVendorLoading(true);
      try {
        // 1. Try Document ID Match (Fastest)
        const idRef = doc(firestore, 'vendors', rawSlug);
        const idSnap = await getDoc(idRef);
        if (idSnap.exists()) {
          setVendorProfile({ id: idSnap.id, ...idSnap.data() });
          setVendorLoading(false);
          return;
        }

        // 2. Try SEO Slug Match
        const slugQ = query(collection(firestore, 'vendors'), where('slug', '==', rawSlug), limit(1));
        const slugSnap = await getDocs(slugQ);

        if (!slugSnap.empty) {
          setVendorProfile({ id: slugSnap.docs[0].id, ...slugSnap.docs[0].data() });
          setVendorLoading(false);
          return;
        }

        // 3. Search by Store ID
        const sidQ = query(collection(firestore, 'vendors'), where('storeId', '==', rawSlug.toLowerCase()), limit(1));
        const sidSnap = await getDocs(sidQ);
        if (!sidSnap.empty) {
          setVendorProfile({ id: sidSnap.docs[0].id, ...sidSnap.docs[0].data() });
          setVendorLoading(false);
          return;
        }
        
      } catch (err) {
        console.error("Vendor resolution error:", err);
      } finally {
        setVendorLoading(false);
      }
    }
    resolveVendor();
  }, [firestore, rawSlug]);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !vendorProfile) return null;
    return query(collection(firestore, 'products'), where('vendorId', '==', vendorProfile.id));
  }, [firestore, vendorProfile]);
  
  const { data: dbProducts, loading: productsLoading } = useCollection<any>(productsQuery, `menu_${vendorProfile?.id}`);

  const categoriesWithProducts = useMemo(() => {
    if (!dbProducts) return [];
    
    const filtered = dbProducts.filter((product: any) => {
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
  }, [searchQuery, dbProducts]);

  const scheduleOpen = useMemo(() => isStoreScheduleOpen(vendorProfile, currentMinutes), [vendorProfile, currentMinutes]);
  const isOffline = vendorProfile?.isOnline === false || !scheduleOpen;

  if (vendorLoading) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Opening Store Hub...</p>
      </div>
    );
  }

  if (!vendorProfile) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-muted/30 h-24 w-24 rounded-full flex items-center justify-center mb-6">
           <Store className="h-12 w-12 text-muted-foreground/30" />
        </div>
        <h2 className="text-xl font-black italic uppercase text-gray-800">Store Not Found</h2>
        <p className="text-xs font-bold text-muted-foreground uppercase mt-2">The hub you are looking for is currently offline.</p>
        <Button onClick={() => router.push('/')} className="mt-8 bg-black rounded-xl font-black uppercase italic shadow-xl">Back to Explore</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-40">
      <div className="relative h-64 w-full">
        <img src={vendorProfile?.bannerUrl || vendorProfile?.imageUrl || 'https://picsum.photos/seed/store/800/400'} className="w-full h-full object-cover" alt="Banner" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-6">
          <Link href="/" className="absolute top-6 left-6 h-10 w-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 active:scale-90 transition-transform"><X className="h-5 w-5" /></Link>
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
        <div className="flex items-center justify-between mb-1">
           <h1 className="text-4xl font-black italic uppercase tracking-tighter">Premium Menu</h1>
        </div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">Curated from {vendorProfile?.storeName || 'Partner Store'}</p>
      </div>

      <div className="px-6 mb-8">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
          <Input 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            placeholder='Search deliciousness...' 
            className="pl-12 h-14 bg-gray-50 border-none rounded-2xl text-lg shadow-inner focus-visible:ring-1 focus-visible:ring-primary/20 font-bold" 
          />
        </div>
      </div>

      <div className="space-y-12">
        {productsLoading ? (
           <div className="px-6 space-y-10">
             {[1, 2].map(i => (
               <div key={i} className="space-y-4">
                 <div className="h-6 w-32 bg-gray-100 rounded-full animate-pulse" />
                 <div className="flex gap-4 overflow-hidden">
                    <div className="h-40 w-40 bg-gray-50 rounded-2xl shrink-0" />
                    <div className="h-40 w-40 bg-gray-50 rounded-2xl shrink-0" />
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
                       <ProductHorizontalItem 
                        key={product.id} 
                        product={{...product, restaurantName: vendorProfile.storeName}} 
                        isOffline={isOffline} 
                       />
                     ))}
                     <div className="min-w-[10px]" />
                  </div>
               </div>
            </div>
          ))
        ) : (
          <div className="px-6 text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed mx-6">
             <Store className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
             <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">No items found matching your search</p>
          </div>
        )}
      </div>
    </div>
  );
}