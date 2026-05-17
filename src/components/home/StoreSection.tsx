
"use client"

import { Star, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';

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

  // Fetch all vendors from stream
  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);

  const { data: dbVendors } = useCollection<any>(vendorsQuery);

  const filteredVendors = useMemo(() => {
    if (!dbVendors) return [];
    
    // Show only approved vendors
    let result = dbVendors.filter(v => v.status === 'approved');
    
    // If town matches, prioritize those, else show all approved ones
    if (currentTown) {
      const townMatch = result.filter(v => v.town === currentTown);
      if (townMatch.length > 0) result = townMatch;
    }
    
    return result;
  }, [dbVendors, currentTown]);

  if (!filteredVendors || filteredVendors.length === 0) return null;

  return (
    <div className="py-6">
      <div className="flex items-center justify-between px-6 mb-5">
        <div className="flex items-center">
          <span className="text-2xl mr-2">🏪</span>
          <h2 className="text-2xl font-black tracking-tighter uppercase italic text-foreground">
            {currentTown ? `Top Stores in ${currentTown}` : 'Trending Stores'}
          </h2>
        </div>
        <Link href="/menu" className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
          View All
        </Link>
      </div>

      <div className="flex overflow-x-auto space-x-5 px-6 no-scrollbar pb-4">
        {filteredVendors.map((store: any) => {
          const displayImage = store.bannerUrl || store.imageUrl || `https://picsum.photos/seed/${store.id}/600/400`;
          const isOffline = store.isOnline === false;
          
          return (
            <Link 
              href={`/menu?vendor=${store.id}`}
              key={store.id} 
              className={cn(
                "min-w-[300px] max-w-[300px] flex flex-col group active:scale-[0.98] transition-all duration-300",
                isOffline && "pointer-events-none opacity-80"
              )}
            >
              <div className="relative h-48 w-full rounded-[2.5rem] overflow-hidden shadow-lg border border-border/40 mb-3 bg-muted group-hover:shadow-xl transition-all">
                <Image 
                  src={displayImage} 
                  alt={store.storeName || 'Store'} 
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="eager"
                />
                
                {/* Closed Now Overlay */}
                {isOffline && (
                  <div className="absolute inset-0 bg-black/60 z-30 flex items-center justify-center">
                    <span className="text-white font-black text-3xl uppercase italic tracking-tighter shadow-2xl">Closed Now</span>
                  </div>
                )}

                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl flex items-center shadow-md border border-black/5 z-20">
                  <span className="text-xs font-black mr-1">{store.rating || '4.5'}</span>
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                </div>

                <div className="absolute bottom-4 left-4 z-20">
                  <div className="bg-[#0B0B0B]/80 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 border border-white/10">
                    <Clock className="h-3 w-3 text-primary" />
                    <span className="text-[10px] font-black text-white uppercase tracking-tight">20-30 MIN</span>
                  </div>
                </div>
              </div>

              <div className="px-2">
                <div className="flex items-center gap-2">
                   {store.imageUrl && (
                     <div className="h-6 w-6 rounded-full overflow-hidden border border-border shrink-0">
                       <img src={store.imageUrl} className="w-full h-full object-cover" alt="Logo" />
                     </div>
                   )}
                   <h3 className="font-black text-xl text-foreground line-clamp-1 italic tracking-tight">{store.storeName}</h3>
                </div>
                <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-tight mb-2 line-clamp-1 ml-8">
                  {store.category || 'Food'} • {store.town || 'Nearby'}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
