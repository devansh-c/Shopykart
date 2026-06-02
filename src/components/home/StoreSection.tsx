"use client"

import { Star, MapPin, Store } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { useMemo, useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

export function StoreSection({ activeMode = 'Food' }: { activeMode?: string }) {
  const firestore = useFirestore();
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);

  useEffect(() => {
    const updateZone = () => {
      setActiveZoneId(localStorage.getItem('active_zone_id'));
    };
    updateZone();
    window.addEventListener('user-address-updated', updateZone);
    return () => window.removeEventListener('user-address-updated', updateZone);
  }, []);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Always fetch all approved vendors and filter in memo for best performance & reactivity
    return collection(firestore, 'vendors');
  }, [firestore]);

  const { data: dbVendors, loading } = useCollection<any>(vendorsQuery);

  const filteredVendors = useMemo(() => {
    if (!dbVendors) return [];
    return dbVendors.filter(v => {
      const isApproved = v.status === 'approved' || !v.status;
      const matchesMode = (v.category || 'Food') === activeMode;
      
      // CRITICAL: Filter by the customer's selected Zone ID
      const matchesZone = !activeZoneId || v.zoneId === activeZoneId;
      
      return isApproved && matchesMode && matchesZone;
    }).sort((a, b) => {
      // Sort online stores first
      const onlineA = a.isOnline !== false ? 1 : 0;
      const onlineB = b.isOnline !== false ? 1 : 0;
      return onlineB - onlineA;
    });
  }, [dbVendors, activeMode, activeZoneId]);

  if (loading && !dbVendors) {
    return (
      <div className="py-2 px-4 flex space-x-4 overflow-hidden">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-3xl h-64 min-w-[280px] shadow-sm border animate-pulse" />
        ))}
      </div>
    );
  }

  if (filteredVendors.length === 0 && !loading) {
    return (
      <div className="py-10 text-center opacity-30 px-6">
        <Store className="h-10 w-10 mx-auto mb-2" />
        <p className="font-black italic uppercase tracking-widest text-[10px]">No {activeMode} Stores in Your Area</p>
      </div>
    );
  }

  return (
    <div className="py-2 content-visibility-auto">
      <div className="flex items-center justify-between mb-4 px-6">
        <h2 className="text-2xl font-black tracking-tighter uppercase italic text-foreground">
          {activeMode} Stores
        </h2>
      </div>

      <div className="flex overflow-x-auto space-x-4 px-6 no-scrollbar pb-4">
        {filteredVendors.map((store: any) => {
          const displayImage = store.bannerUrl || store.imageUrl || `https://picsum.photos/seed/${store.id}/800/400`;
          const isOffline = store.isOnline === false;
          
          return (
            <Link 
              href={`/menu?vendor=${store.id}`}
              key={store.id} 
              className={cn(
                "block min-w-[280px] max-w-[280px] bg-white rounded-3xl overflow-hidden shadow-sm border border-border/40 transition-all active:scale-[0.98] shrink-0",
                isOffline && "opacity-80"
              )}
            >
              <div className="relative h-36 w-full bg-muted">
                <Image 
                  src={displayImage} 
                  alt={store.storeName || 'Store'} 
                  fill 
                  className="object-cover" 
                  loading="lazy" 
                  unoptimized 
                />
                {isOffline && (
                  <div className="absolute inset-0 bg-black/60 z-30 flex items-center justify-center">
                    <span className="text-white font-black text-xl uppercase italic tracking-tighter">Closed Now</span>
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-xl flex items-center gap-1 shadow-sm">
                   <span className="text-[10px] font-black text-black">{store.rating || '4.4'}</span>
                   <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                </div>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-lg font-black text-foreground italic tracking-tight leading-tight truncate mr-2">{store.storeName}</h3>
                  <div className="flex items-center gap-1 text-muted-foreground text-[7px] font-black uppercase tracking-widest bg-muted/50 px-1.5 py-0.5 rounded-full shrink-0">
                    <MapPin className="h-1.5 w-1.5 text-primary" />
                    {store.town || 'Local'}
                  </div>
                </div>

                <div className="flex items-center text-[9px] font-bold text-muted-foreground mb-3">
                  <span className="truncate">{store.category || 'Food'} • Fast Delivery</span>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-dashed border-border/60">
                  <div className="flex items-center gap-2">
                     <div className={cn("h-1.5 w-1.5 rounded-full", isOffline ? "bg-red-500" : "bg-green-500 animate-pulse")} />
                     <span className={cn("text-[8px] font-black uppercase tracking-widest", isOffline ? "text-red-500" : "text-green-600")}>
                        {isOffline ? 'Closed' : 'Accepting'}
                     </span>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-primary italic">View Menu →</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
