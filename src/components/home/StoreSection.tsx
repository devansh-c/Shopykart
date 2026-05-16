"use client"

import { Star, Clock, MapPin, Store as StoreIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export function StoreSection() {
  const [currentTown, setCurrentTown] = useState<string | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTown = localStorage.getItem('user_town');
      if (savedTown) setCurrentTown(savedTown);

      const handleUpdate = () => {
        const updatedTown = localStorage.getItem('user_town');
        if (updatedTown) setCurrentTown(updatedTown);
      };
      
      window.addEventListener('user-address-updated', handleUpdate);
      window.addEventListener('storage', handleUpdate);
      return () => {
        window.removeEventListener('user-address-updated', handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      };
    }
  }, []);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    if (currentTown) {
      return query(
        collection(firestore, 'vendors'),
        where('town', '==', currentTown),
        where('status', '==', 'approved')
      );
    }
    return query(collection(firestore, 'vendors'), where('status', '==', 'approved'));
  }, [firestore, currentTown]);

  const { data: vendors } = useCollection<any>(vendorsQuery);

  return (
    <div className="py-6">
      <div className="flex items-center justify-between px-6 mb-5">
        <div className="flex items-center">
          <span className="text-2xl mr-2">🏪</span>
          <h2 className="text-2xl font-black tracking-tighter uppercase italic text-foreground">
            {currentTown ? `Top Stores in ${currentTown}` : 'All Stores'}
          </h2>
        </div>
        <Link href="/menu" className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
          View All
        </Link>
      </div>

      <div className="flex overflow-x-auto space-x-5 px-6 no-scrollbar pb-4">
        {vendors && vendors.length > 0 ? (
          vendors.map((store: any) => {
            const imageUrl = store.imageUrl || `https://picsum.photos/seed/${store.id}/600/400`;
            return (
              <Link 
                href={`/menu?vendor=${store.id}`}
                key={store.id} 
                className="min-w-[300px] max-w-[300px] flex flex-col group active:scale-[0.98] transition-all duration-300"
              >
                <div className="relative h-48 w-full rounded-[2.5rem] overflow-hidden shadow-lg border border-border/40 mb-3 bg-muted group-hover:shadow-xl transition-all">
                  <Image 
                    src={imageUrl} 
                    alt={store.storeName || 'Store'} 
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="eager"
                  />
                  
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl flex items-center shadow-md border border-black/5 z-20">
                    <span className="text-xs font-black mr-1">{store.rating || '4.5'}</span>
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  </div>

                  {store.deliveryTime && (
                    <div className="absolute bottom-4 left-4 z-20">
                      <div className="bg-[#0B0B0B]/80 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 border border-white/10">
                        <Clock className="h-3 w-3 text-primary" />
                        <span className="text-[10px] font-black text-white uppercase tracking-tight">{store.deliveryTime}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-2">
                  <h3 className="font-black text-xl text-foreground line-clamp-1 italic tracking-tight">{store.storeName}</h3>
                  <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-tight mb-2 line-clamp-1">
                    {store.category || 'Multicuisine'} • {store.address || store.town || 'Local Area'}
                  </p>
                </div>
              </Link>
            );
          })
        ) : null}
      </div>
    </div>
  );
}
