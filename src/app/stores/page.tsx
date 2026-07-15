'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, MapPin, Store, Star, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn, slugify } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

/**
 * @fileOverview StoresPage with Strict Location Filtering.
 * Ensures Ranipur and Mauranipur content never mixes.
 */
export default function StoresPage() {
  const [searchQuery, setSearchQuery] = useState('');
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

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);

  const { data: dbVendors, loading } = useCollection<any>(vendorsQuery);

  const filteredVendors = useMemo(() => {
    if (!dbVendors) return [];
    
    const searchLower = searchQuery.toLowerCase().trim();
    
    // Normalize target city for strict exact matching
    const targetCityNormalized = (activeCity || '').toLowerCase().trim();

    return dbVendors.filter(v => {
      const vTown = (v.town || '').toLowerCase().trim();

      // ULTRA-STRICT LOCATION FILTERING
      if (targetCityNormalized && targetCityNormalized !== 'local') {
        // Must match exactly to the town name
        const matchesCity = vTown === targetCityNormalized;
        
        // If it doesn't match the city, we hide it immediately
        if (!matchesCity) return false;
      }

      const matchesSearch = !searchLower || 
        v.storeName?.toLowerCase().includes(searchLower) || 
        v.category?.toLowerCase().includes(searchLower);
      
      const isApproved = v.status === 'approved' || !v.status;
      
      return matchesSearch && isApproved;
    }).sort((a, b) => {
      const onlineA = a.isOnline !== false ? 1 : 0;
      const onlineB = b.isOnline !== false ? 1 : 0;
      if (onlineA !== onlineB) return onlineB - onlineA;
      return (b.rating || 0) - (a.rating || 0);
    });
  }, [dbVendors, activeCity, searchQuery]);

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="px-6 pt-12 pb-6 flex flex-col space-y-6">
        <div className="flex items-center justify-between">
           <h1 className="text-4xl font-black italic uppercase tracking-tighter">Premium Stores</h1>
           <div className="h-10 w-10 bg-white rounded-full shadow-sm border border-border/50 flex items-center justify-center text-primary">
              <Store className="h-5 w-5" />
           </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none group-focus-within:text-primary transition-colors" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search store name...' 
            className="pl-12 h-14 bg-white border-none rounded-xl text-lg shadow-sm focus-visible:ring-1 focus-visible:ring-primary/20 font-bold"
          />
        </div>

        {activeCity && (
          <div className="flex items-center gap-2 px-1">
            <MapPin className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Showing results for {activeCity}</span>
          </div>
        )}
      </div>

      <div className="px-6 space-y-6 content-visibility-auto">
        {loading && !dbVendors ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 w-full bg-white rounded-3xl border-2 border-border/40 animate-pulse" />
            ))}
          </div>
        ) : filteredVendors.length > 0 ? (
          filteredVendors.map((store: any) => {
            const displayImage = store.bannerUrl || store.imageUrl || `https://picsum.photos/seed/${store.id}/800/400`;
            const isOffline = store.isOnline === false;
            const rating = store.rating || '0.0';
            const slug = slugify(store.storeName);

            return (
              <Link 
                href={`/store/${slug}-${store.id}`}
                key={store.id} 
                className={cn(
                  "block bg-white rounded-3xl overflow-hidden shadow-sm border border-border/40 transition-all active:scale-[0.98] group",
                  isOffline && "opacity-80 grayscale-[0.2]"
                )}
              >
                <div className="relative h-36 w-full bg-muted overflow-hidden">
                  <Image src={displayImage} alt={store.storeName} fill className="object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" unoptimized />
                  {isOffline && (
                    <div className="absolute inset-0 bg-black/60 z-30 flex items-center justify-center">
                      <span className="text-white font-black text-2xl uppercase italic tracking-tighter border-2 border-white/30 px-6 py-2 rounded-xl backdrop-blur-md">Closed Now</span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xl font-black text-gray-900 italic uppercase tracking-tighter leading-none uppercase flex-1 truncate mr-2">{store.storeName}</h3>
                    <div className="bg-[#15803d] text-white px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                       <span className="text-[10px] font-black">{rating}</span>
                       <Star className="h-3 w-3 fill-white" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                     <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{store.deliveryTime || '20 MIN'}</span>
                     </div>
                     <div className="h-3 w-[1px] bg-gray-200" />
                     <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">{store.town || 'Nearby'}</span>
                     </div>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-muted/50">
            <Store className="h-16 w-16 mx-auto text-muted-foreground/10 mb-4" />
            <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm px-6">
              {searchQuery ? `No stores matching "${searchQuery}"` : `No Stores Found in ${activeCity || 'Your Area'}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
