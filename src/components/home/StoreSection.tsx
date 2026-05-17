
"use client"

import { Star, MapPin } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

export function StoreSection() {
  const [currentTown, setCurrentTown] = useState<string | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateTown = () => {
        const savedTown = localStorage.getItem('user_town');
        if (savedTown) setCurrentTown(savedTown);
      };
      
      updateTown();
      window.addEventListener('user-address-updated', updateTown);
      window.addEventListener('storage', updateTown);
      return () => {
        window.removeEventListener('user-address-updated', updateTown);
        window.removeEventListener('storage', updateTown);
      };
    }
  }, []);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);

  const { data: dbVendors } = useCollection<any>(vendorsQuery);

  const filteredVendors = useMemo(() => {
    if (!dbVendors) return [];
    let result = dbVendors.filter(v => v.status === 'approved');
    if (currentTown) {
      const townMatch = result.filter(v => v.town === currentTown);
      if (townMatch.length > 0) result = townMatch;
    }
    return result;
  }, [dbVendors, currentTown]);

  if (!filteredVendors || filteredVendors.length === 0) return null;

  return (
    <div className="py-4 px-4">
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
                "block bg-white rounded-[2rem] overflow-hidden shadow-sm border border-border/40 transition-all active:scale-[0.98]",
                isOffline && "pointer-events-none opacity-80"
              )}
            >
              {/* Store Image */}
              <div className="relative h-44 w-full bg-muted">
                <Image 
                  src={displayImage} 
                  alt={store.storeName || 'Store'} 
                  fill
                  className="object-cover"
                  loading="lazy"
                />
                
                {/* Promoted Tag */}
                <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md text-white text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                  Promoted
                </div>

                {/* Closed Overlay */}
                {isOffline && (
                  <div className="absolute inset-0 bg-black/60 z-30 flex items-center justify-center">
                    <span className="text-white font-black text-3xl uppercase italic tracking-tighter shadow-2xl">Closed Now</span>
                  </div>
                )}
              </div>

              {/* Store Details */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-lg font-black text-foreground italic tracking-tight">{store.storeName}</h3>
                  <div className="bg-green-700 text-white px-2 py-0.5 rounded-lg flex items-center gap-1 text-sm font-black shadow-sm">
                    {store.rating || '4.4'} <Star className="h-3 w-3 fill-white" />
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs font-bold text-muted-foreground mb-1">
                  <span className="truncate max-w-[70%]">{store.category || 'Food'} • Snacks • Beverages</span>
                  <span>₹200 for two</span>
                </div>

                <p className="text-[10px] font-medium text-muted-foreground/60 mb-3">{store.address || store.town || 'Nearby Location'}</p>

                <div className="flex justify-between items-center pt-2 border-t border-dashed border-border/60">
                  <span className="text-primary text-[9px] font-black uppercase tracking-widest">
                    {isOffline ? 'Opens tomorrow' : 'Opens at 11am'}
                  </span>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[9px] font-black uppercase tracking-widest">
                    <MapPin className="h-2.5 w-2.5 text-primary" />
                    2.4 km
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
