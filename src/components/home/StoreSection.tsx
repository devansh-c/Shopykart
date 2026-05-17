"use client"

import { Star, MapPin, Store as StoreIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import { useMemo } from "react"
import { cn } from "@/lib/utils"

export function StoreSection() {
  const firestore = useFirestore();

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);

  const { data: dbVendors, loading } = useCollection<any>(vendorsQuery);

  const filteredVendors = useMemo(() => {
    if (loading) return [];
    return dbVendors?.filter(v => v.status === 'approved') || [];
  }, [dbVendors, loading]);

  if (!loading && filteredVendors.length === 0) return null;

  return (
    <div className="py-2 px-4">
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-2xl font-black tracking-tighter uppercase italic text-foreground">
          All Stores
        </h2>
        <Link href="/menu" className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
          View All
        </Link>
      </div>

      <div className="space-y-6">
        {filteredVendors.map((store: any) => {
          const displayImage = store.bannerUrl || store.imageUrl || `https://picsum.photos/seed/${store.id}/800/500`;
          const isOffline = store.isOnline === false;
          
          return (
            <Link 
              href={`/menu?vendor=${store.id}`}
              key={store.id} 
              className={cn(
                "block bg-white rounded-3xl overflow-hidden shadow-sm border border-border/40 transition-all active:scale-[0.98]",
                isOffline && "pointer-events-none opacity-80"
              )}
            >
              <div className="relative h-36 w-full bg-muted">
                <Image 
                  src={displayImage} 
                  alt={store.storeName || 'Store'} 
                  fill
                  className="object-cover"
                  loading="lazy"
                />
                
                <div className="absolute top-2.5 left-2.5 bg-black/40 backdrop-blur-md text-white text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Promoted
                </div>

                {isOffline && (
                  <div className="absolute inset-0 bg-black/60 z-30 flex items-center justify-center">
                    <span className="text-white font-black text-2xl uppercase italic tracking-tighter shadow-2xl">Closed Now</span>
                  </div>
                )}
              </div>

              <div className="p-3">
                <div className="flex justify-between items-start mb-0.5">
                  <h3 className="text-base font-black text-foreground italic tracking-tight leading-tight">{store.storeName}</h3>
                  <div className="bg-green-700 text-white px-1.5 py-0.5 rounded-md flex items-center gap-1 text-[10px] font-black shadow-sm shrink-0">
                    {store.rating || '4.4'} <Star className="h-2.5 w-2.5 fill-white" />
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground mb-0.5">
                  <span className="truncate max-w-[70%]">{store.category || 'Food'} • Selection</span>
                  <span className="shrink-0">₹200 for two</span>
                </div>

                <p className="text-[9px] font-medium text-muted-foreground/60 mb-2 truncate">{store.address || store.town || 'Nearby Location'}</p>

                <div className="flex justify-between items-center pt-2 border-t border-dashed border-border/60">
                  <span className={cn("text-[8px] font-black uppercase tracking-widest", isOffline ? "text-red-500" : "text-primary")}>
                    {isOffline ? 'Closed Now' : 'Opens now'}
                  </span>
                  <div className="flex items-center gap-1 text-muted-foreground text-[8px] font-black uppercase tracking-widest">
                    <MapPin className="h-2 w-2 text-primary" />
                    Live in {store.town || 'Local'}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
