"use client"

import { Star, MapPin, Store } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

export function StoreSection({ activeMode = 'Food' }: { activeMode?: string }) {
  const firestore = useFirestore();

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);

  const { data: dbVendors, loading } = useCollection<any>(vendorsQuery);

  const filteredVendors = useMemo(() => {
    if (loading || !dbVendors) return [];
    return dbVendors.filter(v => {
      const isApproved = v.status === 'approved' || !v.status;
      const matchesMode = (v.category || 'Food') === activeMode;
      return isApproved && matchesMode;
    });
  }, [dbVendors, loading, activeMode]);

  if (loading) {
    return (
      <div className="py-2 px-4 space-y-4">
        <Skeleton className="h-8 w-32 rounded-lg" />
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-3xl h-64 w-full shadow-sm border animate-pulse" />
        ))}
      </div>
    );
  }

  if (filteredVendors.length === 0) {
    return (
      <div className="py-20 text-center opacity-30 px-6">
        <Store className="h-12 w-12 mx-auto mb-4" />
        <p className="font-black italic uppercase tracking-widest text-sm">No {activeMode} Stores Found</p>
      </div>
    );
  }

  return (
    <div className="py-2 px-4">
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-2xl font-black tracking-tighter uppercase italic text-foreground">
          {activeMode} Stores
        </h2>
      </div>

      <div className="space-y-6">
        {filteredVendors.map((store: any) => {
          const displayImage = store.bannerUrl || store.imageUrl || `https://picsum.photos/seed/${store.id}/800/400`;
          const isOffline = store.isOnline === false;
          
          return (
            <Link 
              href={`/menu?vendor=${store.id}`}
              key={store.id} 
              className={cn(
                "block bg-white rounded-3xl overflow-hidden shadow-sm border border-border/40 transition-all active:scale-[0.98]",
                isOffline && "opacity-80"
              )}
            >
              <div className="relative h-44 w-full bg-muted">
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
                    <span className="text-white font-black text-2xl uppercase italic tracking-tighter shadow-2xl">Closed Now</span>
                  </div>
                )}

                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-xl flex items-center gap-1 shadow-sm">
                   <span className="text-[10px] font-black text-black">{store.rating || '4.4'}</span>
                   <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                </div>
              </div>

              <div className="p-5">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-xl font-black text-foreground italic tracking-tight leading-tight">{store.storeName}</h3>
                  <div className="flex items-center gap-1 text-muted-foreground text-[8px] font-black uppercase tracking-widest bg-muted/50 px-2 py-1 rounded-full">
                    <MapPin className="h-2 w-2 text-primary" />
                    {store.town || 'Local'}
                  </div>
                </div>

                <div className="flex items-center text-[10px] font-bold text-muted-foreground mb-4">
                  <span>{store.category || 'Food'} • Fast Delivery • Premium Selection</span>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-dashed border-border/60">
                  <div className="flex items-center gap-2">
                     <div className={cn("h-2 w-2 rounded-full", isOffline ? "bg-red-500" : "bg-green-500 animate-pulse")} />
                     <span className={cn("text-[9px] font-black uppercase tracking-widest", isOffline ? "text-red-500" : "text-green-600")}>
                        {isOffline ? 'Closed Now' : 'Accepting Orders'}
                     </span>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary italic">View Menu →</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
