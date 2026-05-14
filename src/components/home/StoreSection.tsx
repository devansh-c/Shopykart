
"use client"

import { Star, Clock, Tag, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

export function StoreSection() {
  const firestore = useFirestore();
  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);

  const { data: vendors, loading } = useCollection<any>(vendorsQuery);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!vendors || vendors.length === 0) return null;

  return (
    <div className="py-6">
      <div className="flex items-center justify-between px-6 mb-5">
        <div className="flex items-center">
          <span className="text-2xl mr-2">🏪</span>
          <h2 className="text-2xl font-black tracking-tighter uppercase italic text-foreground">Top Stores</h2>
        </div>
        <Link href="/menu" className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
          View All
        </Link>
      </div>

      <div className="flex overflow-x-auto space-x-5 px-6 no-scrollbar pb-4">
        {vendors.map((store) => {
          const imageUrl = store.imageUrl || `https://picsum.photos/seed/${store.id}/600/400`;
          return (
            <Link 
              href={`/menu?vendor=${store.id}`}
              key={store.id} 
              className="min-w-[280px] max-w-[280px] flex flex-col group active:scale-[0.98] transition-all duration-300"
            >
              <div className="relative h-44 w-full rounded-[2rem] overflow-hidden shadow-lg border border-border/40 mb-3 bg-muted group-hover:shadow-xl transition-all">
                <Image 
                  src={imageUrl} 
                  alt={store.storeName} 
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-2 py-1 rounded-xl flex items-center shadow-md border border-black/5">
                  <span className="text-[11px] font-black mr-1">{store.rating || '4.5'}</span>
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                </div>

                <div className="absolute bottom-4 left-4">
                  <div className="bg-primary px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 animate-in slide-in-from-left-4 duration-500">
                    <Tag className="h-3 w-3 text-white" />
                    <span className="text-[10px] font-black text-white uppercase tracking-tight">Top Rated Store</span>
                  </div>
                </div>
              </div>

              <div className="px-1">
                <div className="flex justify-between items-start mb-0.5">
                  <h3 className="font-black text-lg text-foreground line-clamp-1 italic tracking-tight">{store.storeName}</h3>
                </div>
                
                <div className="flex items-center text-muted-foreground text-[11px] font-bold uppercase tracking-tight mb-2">
                  {store.category || 'Multicuisine'}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center text-primary font-black text-[10px] uppercase tracking-widest">
                    <Clock className="h-3 w-3 mr-1" />
                    15-20 min
                  </div>
                  <div className="flex items-center text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                    <MapPin className="h-3 w-3 mr-1" />
                    Nearby
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
