'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Search, X, Clock, MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/cart/CartProvider';
import { cn, slugify } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { ProductQuickView } from '@/components/product/ProductQuickView';
import { isStoreScheduleOpen } from '@/components/home/PopularProducts';

/**
 * @fileOverview MenuContent with SEO Slug support and robust data fetching.
 */
export default function MenuContent({ forcedSlug }: { forcedSlug?: string }) {
  const params = useParams();
  const slug = forcedSlug || (params?.slug as string);
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const { addToCart } = useCart();
  const [currentMinutes, setCurrentMinutes] = useState<number | null>(null);
  
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

  // SEO Query: Find vendor by slug first, then by ID as fallback
  const vendorSlugQuery = useMemoFirebase(() => {
    if (!firestore || !slug) return null;
    return query(collection(firestore, 'vendors'), where('slug', '==', slug), limit(1));
  }, [firestore, slug]);

  const { data: slugResults, loading: slugLoading } = useCollection<any>(vendorSlugQuery);

  const vendorIdQuery = useMemoFirebase(() => {
    if (!firestore || !slug || (slugResults && slugResults.length > 0)) return null;
    return query(collection(firestore, 'vendors'), where('__name__', '==', slug), limit(1));
  }, [firestore, slug, slugResults]);

  const { data: idResults, loading: idLoading } = useCollection<any>(vendorIdQuery);

  const vendorProfile = (slugResults && slugResults.length > 0) ? slugResults[0] : (idResults && idResults.length > 0 ? idResults[0] : null);
  const vendorLoading = slugLoading || idLoading;

  const scheduleOpen = isStoreScheduleOpen(vendorProfile, currentMinutes);
  const isOffline = vendorProfile?.isOnline === false || !scheduleOpen;

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !vendorProfile) return null;
    return query(collection(firestore, 'products'), where('vendorId', '==', vendorProfile.id));
  }, [firestore, vendorProfile]);
  const { data: dbProducts, loading: dbLoading } = useCollection<any>(productsQuery);

  const filteredAndSortedProducts = useMemo(() => {
    if (!dbProducts) return [];
    return dbProducts.filter((product: any) => {
      const matchesSearch = (product.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || product.category?.toLowerCase() === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory, dbProducts]);

  if (vendorLoading && !vendorProfile) return <div className="h-screen bg-white flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (!vendorProfile && !vendorLoading) return <div className="h-screen bg-white flex flex-col items-center justify-center p-8"><h2 className="text-xl font-black italic uppercase">Store Not Found</h2><Button onClick={() => router.push('/')} className="mt-8">Home</Button></div>;

  return (
    <div className="min-h-screen bg-white pb-40">
      <div className="relative h-64 w-full">
        <img src={vendorProfile?.bannerUrl || vendorProfile?.imageUrl} className="w-full h-full object-cover" alt="Banner" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-6">
          <Link href="/" className="absolute top-6 left-6 h-10 w-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20"><X className="h-5 w-5" /></Link>
          <div className="flex items-end gap-4">
            <div className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-primary shadow-xl shrink-0">
              <img src={vendorProfile?.imageUrl} className="h-full w-full object-cover" alt="Logo" />
            </div>
            <div className="flex-1 pb-1 min-w-0">
              <h1 className="text-2xl font-black italic uppercase text-white tracking-tighter leading-none mb-2 truncate">{vendorProfile?.storeName}</h1>
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-primary italic">
                <span className="flex items-center gap-1 shrink-0"><Clock className="h-3 w-3" /> {vendorProfile?.deliveryTime || '20 min'}</span>
                <span className="flex items-center gap-1 text-white/60 truncate"><MapPin className="h-3 w-3" /> {vendorProfile?.town}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pt-12 pb-4"><h1 className="text-4xl font-black italic uppercase tracking-tighter">Menu</h1></div>

      <div className="px-6 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder='Search items...' className="pl-12 h-14 bg-white border-none rounded-full text-lg shadow-sm" />
        </div>
      </div>

      <div className="px-6 space-y-6">
        {filteredAndSortedProducts.map((product: any) => (
          <div key={product.id} className={cn("premium-card p-5 flex justify-between items-center bg-white relative overflow-hidden", isOffline && "opacity-60")}>
            <div className="flex-1 pr-4 min-w-0">
              <ProductQuickView product={product} vendorScheduleOpen={scheduleOpen}>
                <button className="text-left w-full">
                  <h3 className="font-black text-xl italic tracking-tight leading-tight mb-1 text-foreground line-clamp-2 uppercase">{product.name}</h3>
                  <div className="text-2xl font-black text-foreground italic tracking-tighter">₹{(product.price || 0).toFixed(0)}</div>
                </button>
              </ProductQuickView>
            </div>
            <div className="relative w-28 h-28 shrink-0">
              <Image src={product.imageUrl} alt={product.name} fill className="object-cover rounded-2xl" unoptimized />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-full px-1.5 z-20">
                <button onClick={() => !isOffline && addToCart({...product, quantity: 1})} className="w-full h-9 bg-white text-primary border-2 border-primary shadow-lg font-black text-[9px] uppercase rounded-xl active:scale-95 transition-all">ADD</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
