'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, MapPin, Store, Star, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

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
    
    const searchLower = searchQuery.toLowerCase();
    const targetCityNormalized = (activeCity || '').toLowerCase().trim();

    return dbVendors.filter(v => {
      // STRICT ZONE FILTERING
      if (activeZoneId || targetCityNormalized) {
        const matchesZone = activeZoneId && v.zoneId === activeZoneId;
        const matchesTown = targetCityNormalized && (v.town || '').toLowerCase().trim() === targetCityNormalized;
        
        // Exact match required
        if (!matchesZone && !matchesTown) return false;
      }

      const matchesSearch = !searchLower || 
        v.storeName?.toLowerCase().includes(searchLower) || 
        v.category?.toLowerCase().includes(searchLower);
      const isApproved = v.status === 'approved' || !v.status;
      
      return matchesSearch && isApproved;
    }).sort((a, b) => {
      const onlineA = a.isOnline !== false ? 1 : 0;
      const onlineB = b.isOnline !== false ? 1 : 0;
      return onlineB - onlineA;
    });
  }, [dbVendors, activeZoneId, activeCity, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-32">
      <div className="px-6 pt-12 pb-6 flex flex-col space-y-6">
        <div className="flex items-center justify-between">
           <h1 className="text-4xl font-black italic uppercase tracking-tighter">Stores</h1>
           <div className="h-10 w-10 bg-white rounded-full shadow-sm border border-border/50 flex items-center justify-center">
              <Store className="h-5 w-5 text-primary" />
           </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none group-focus-within:text-primary transition-colors" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search store name or category...' 
            className="pl-12 h-14 bg-white border-none rounded-2xl text-lg shadow-sm focus-visible:ring-1 focus-visible:ring-primary/20 font-bold"
          />
        </div>
      </div>

      <div className="px-6 space-y-6 content-visibility-auto">
        {loading && !dbVendors ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-72 w-full bg-white rounded-[2rem] border-2 border-border/40 animate-pulse" />
            ))}
          </div>
        ) : filteredVendors.length > 0 ? (
          filteredVendors.map((store: any) => {
            const displayImage = store.bannerUrl || store.imageUrl || `https://picsum.photos/seed/${store.id}/800/400`;
            const isOffline = store.isOnline === false;

            return (
              <Link 
                href={`/menu?vendor=${store.id}`}
                key={store.id} 
                className={cn(
                  "block bg-white rounded-[2rem] overflow-hidden shadow-sm border border-border/40 transition-all active:scale-[0.98] group",
                  isOffline && "opacity-80 grayscale-[0.2]"
                )}
              >
                <div className="relative h-44 w-full bg-muted">
                  <Image src={displayImage} alt={store.storeName} fill className="object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" unoptimized />
                  {isOffline && (
                    <div className="absolute inset-0 bg-black/60 z-30 flex items-center justify-center">
                      <span className="text-white font-black text-2xl uppercase italic tracking-tighter px-6 py-2 border-2 border-white/30 rounded-xl backdrop-blur-sm">Closed Now</span>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-xl border border-white/50">
                    <span className="text-xs font-black text-black">{store.rating || '4.4'}</span>
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-2xl font-black text-gray-800 italic tracking-tight leading-none mb-2 uppercase">{store.storeName}</h3>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded-full tracking-widest">{store.category || 'Food'}</span>
                         <span className="h-1 w-1 bg-gray-300 rounded-full" />
                         <span className="text-[10px] font-black uppercase text-primary tracking-widest italic">{store.town || 'Nearby'}</span>
                      </div>
                    </div>
                    <div className="bg-primary/5 p-3 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-colors shadow-inner">
                       <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-5 mt-5 border-t border-dashed border-border/80">
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{store.deliveryTime || '25 min'}</span>
                       </div>
                       <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Fast Delivery</span>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                       <div className={cn("h-2 w-2 rounded-full", isOffline ? "bg-red-500" : "bg-green-500 animate-pulse")} />
                       <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", isOffline ? "text-red-500" : "text-green-600")}>
                          {isOffline ? 'OFFLINE' : 'ACCEPTING'}
                       </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-muted/50">
            <Store className="h-16 w-16 mx-auto text-muted-foreground/10 mb-4" />
            <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm px-6">
              {searchQuery ? `No stores matching "${searchQuery}"` : "No Stores Found in Your Area"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
