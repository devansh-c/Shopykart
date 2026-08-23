
"use client"

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Search, X, Clock, MapPin, Loader2, Store } from 'lucide-react';
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
 * @fileOverview MenuContent with SPA Fallback to prevent 404s.
 */
export default function MenuContent({ forcedSlug }: { forcedSlug?: string }) {
  const params = useParams();
  const rawSlug = forcedSlug || (params?.slug as string);
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
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
      if (!firestore || !rawSlug || rawSlug === 'default') {
        setVendorLoading(false);
        return;
      }
      setVendorLoading(true);
      try {
        const slugQ = query(collection(firestore, 'vendors'), where('slug', '==', rawSlug), limit(1));
        const slugSnap = await getDocs(slugQ);

        if (!slugSnap.empty) {
          setVendorProfile({ id: slugSnap.docs[0].id, ...slugSnap.docs[0].data() });
          setVendorLoading(false);
          return;
        }

        const idRef = doc(firestore, 'vendors', rawSlug);
        const idSnap = await getDoc(idRef);
        if (idSnap.exists()) {
          setVendorProfile({ id: idSnap.id, ...idSnap.data() });
          setVendorLoading(false);
          return;
        }

        const allVendorsSnap = await getDocs(collection(firestore, 'vendors'));
        const matchedVendor = allVendorsSnap.docs.find(d => {
          const data = d.data();
          return slugify(data.storeName || '') === rawSlug;
        });

        if (matchedVendor) {
          setVendorProfile({ id: matchedVendor.id, ...matchedVendor.data() });
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

  const filteredProducts = useMemo(() => {
    if (!dbProducts) return [];
    return dbProducts.filter((product: any) => {
      if (product.isDeleted) return false;
      const matchesSearch = (product.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || product.category?.toLowerCase() === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory, dbProducts]);

  const scheduleOpen = useMemo(() => isStoreScheduleOpen(vendorProfile, currentMinutes), [vendorProfile, currentMinutes]);
  const isOffline = vendorProfile?.isOnline === false || !scheduleOpen;

  if (vendorLoading) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Resolving Store Hub...</p>
      </div>
    );
  }

  if (!vendorProfile && rawSlug !== 'default') {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-muted/30 h-24 w-24 rounded-full flex items-center justify-center mb-6">
           <Store className="h-12 w-12 text-muted-foreground/30" />
        </div>
        <h2 className="text-xl font-black italic uppercase text-gray-800">Store Not Found</h2>
        <p className="text-xs font-bold text-muted-foreground uppercase mt-2">The link you followed might be broken or expired.</p>
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
            <div className="flex-1 pb-1 min-w-0">
              <h1 className="text-2xl font-black italic uppercase text-white tracking-tighter leading-none mb-2 truncate drop-shadow-lg">{vendorProfile?.storeName}</h1>
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-primary italic">
                <span className="flex items-center gap-1 shrink-0 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-white/10"><Clock className="h-3 w-3" /> {vendorProfile?.deliveryTime || '20 min'}</span>
                <span className="flex items-center gap-1 text-white/80 truncate"><MapPin className="h-3 w-3" /> {vendorProfile?.town}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pt-12 pb-4">
        <div className="flex items-center justify-between mb-1">
           <h1 className="text-4xl font-black italic uppercase tracking-tighter">Premium Menu</h1>
           <Badge className="bg-primary text-white border-none font-black text-[10px]">{filteredProducts.length} ITEMS</Badge>
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

      <div className="px-6 space-y-6">
        {productsLoading && !dbProducts ? (
           <div className="space-y-6">
             {[1, 2, 3].map(i => <div key={i} className="h-32 w-full bg-muted/20 animate-pulse rounded-[2rem]" />)}
           </div>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((product: any) => (
            <div key={product.id} className={cn(
              "premium-card p-5 flex justify-between items-center bg-white relative overflow-hidden group hover:shadow-xl transition-all",
              isOffline && "opacity-60 grayscale-[0.5]"
            )}>
              <div className="flex-1 pr-4 min-w-0">
                <ProductQuickView product={product} vendorScheduleOpen={scheduleOpen}>
                  <button className="text-left w-full pointer-events-auto">
                    <h3 className="font-black text-xl italic tracking-tight leading-tight mb-2 text-gray-900 group-hover:text-primary transition-colors line-clamp-2 uppercase">{product.name}</h3>
                    <div className="text-3xl font-black text-gray-900 italic tracking-tighter">₹{(product.price || 0).toFixed(0)}</div>
                  </button>
                </ProductQuickView>
              </div>
              <div className="relative w-28 h-28 shrink-0">
                <ProductQuickView product={product} vendorScheduleOpen={scheduleOpen}>
                  <div className="relative w-full h-full cursor-pointer overflow-hidden rounded-3xl border border-gray-100 shadow-md">
                    <Image src={product.imageUrl} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" unoptimized />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                </ProductQuickView>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[90%] z-20">
                  <ProductQuickView product={product} vendorScheduleOpen={scheduleOpen}>
                    <button className="w-full h-9 bg-white text-primary border-2 border-primary shadow-lg font-black text-[10px] uppercase rounded-xl active:scale-95 transition-all hover:bg-primary hover:text-white">
                      ADD
                    </button>
                  </ProductQuickView>
                </div>
              </div>
              
              {isOffline && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-[7px] font-black px-2 py-0.5 rounded-full uppercase italic tracking-widest z-30 shadow-lg">
                  Unavailable
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed">
             <Store className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
             <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">Menu is empty or hidden</p>
          </div>
        )}
      </div>
    </div>
  );
}
