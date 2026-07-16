"use client"

import { Star, MapPin, Clock, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, limit } from "firebase/firestore"
import React, { useMemo, useTransition, useState, useEffect } from "react"
import { cn, slugify } from "@/lib/utils"
import { useRouter } from "next/navigation"

export const StoreSection = React.memo(({ activeMode = 'Food' }: { activeMode?: string }) => {
  const firestore = useFirestore();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);

  useEffect(() => {
    const updateLoc = () => {
      setActiveZoneId(localStorage.getItem('active_zone_id'));
    };
    updateLoc();
    window.addEventListener('user-address-updated', updateLoc);
    return () => window.removeEventListener('user-address-updated', updateLoc);
  }, []);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'vendors'), limit(1000));
  }, [firestore]);

  const { data: dbVendors, loading } = useCollection<any>(vendorsQuery);

  const filteredVendors = useMemo(() => {
    if (!dbVendors) return [];
    
    return dbVendors.filter(v => {
      if (activeZoneId) {
        if (v.zoneId !== activeZoneId) {
          return false;
        }
      }
      return (v.category || 'Food').toLowerCase() === activeMode.toLowerCase();
    }).sort((a, b) => {
      // SORT BY RATING (HIGHEST FIRST)
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      return ratingB - ratingA;
    });
  }, [dbVendors, activeMode, activeZoneId]);

  const handleStoreClick = (store: any) => {
    const slug = store.slug || slugify(store.storeName);
    startTransition(() => {
      router.push(`/store/${slug}-${store.id}`);
    });
  };

  if (loading || filteredVendors.length === 0) return null;

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6 px-6">
        <h2 className="text-2xl font-black tracking-tighter uppercase italic text-gray-900 leading-none">Explore <span className="text-primary">Hub</span></h2>
      </div>

      <div className={cn("flex overflow-x-auto space-x-5 px-6 no-scrollbar pb-4 transition-opacity", isPending && "opacity-50")}>
        {filteredVendors.map((store: any) => (
          <button 
            onClick={() => handleStoreClick(store)}
            key={store.id} 
            className="block text-left min-w-[280px] max-w-[280px] bg-white rounded-3xl overflow-hidden shadow-sm border border-border shrink-0 transform-gpu group"
          >
            <div className="relative h-36 w-full bg-muted overflow-hidden">
              <Image src={store.imageUrl} alt={store.storeName} fill className="object-cover group-hover:scale-105 transition-transform duration-700" unoptimized />
            </div>
            <div className="p-4">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-lg font-black text-gray-900 italic uppercase truncate flex-1 mr-2">{store.storeName}</h3>
                <div className="bg-[#15803d] text-white px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm shrink-0">
                  <span className="text-[10px] font-black">{store.rating || '4.0'}</span>
                  <Star className="h-2.5 w-2.5 fill-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-0.5 text-[9px] font-bold text-gray-500 uppercase">
                 <div className="flex items-center gap-1"><Clock className="h-3 w-3" /><span>{store.deliveryTime || '20 MIN'}</span></div>
                 <div className="h-2.5 w-[1px] bg-gray-200" />
                 <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /><span>{store.town || 'Local'}</span></div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

StoreSection.displayName = "StoreSection";