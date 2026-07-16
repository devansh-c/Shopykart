"use client"

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, limit } from "firebase/firestore"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useCart } from "@/components/cart/CartProvider"
import { Plus, Flame, Megaphone, Trophy, Sparkles, Zap, ChevronRight } from "lucide-react"
import { cn, slugify } from "@/lib/utils"
import { useState, useEffect, useMemo } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { isStoreScheduleOpen } from "./PopularProducts"

const CARD_COLORS = [
  "from-[#0056D2] to-[#003C91]",
  "from-[#6B8E23] to-[#4B6312]",
  "from-[#7B1FA2] to-[#4A148C]",
  "from-[#D35400] to-[#A04000]",
  "from-[#C0392B] to-[#922B21]",
];

export function TopTenProducts() {
  const firestore = useFirestore();
  const router = useRouter();
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [currentMinutes, setCurrentMinutes] = useState<number | null>(null);

  useEffect(() => {
    const updateZone = () => {
      setActiveZoneId(localStorage.getItem('active_zone_id'));
    };
    updateZone();
    window.addEventListener('user-address-updated', updateZone);

    const syncTime = () => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    };
    syncTime();
    const interval = setInterval(syncTime, 60000);

    return () => {
      window.removeEventListener('user-address-updated', updateZone);
      clearInterval(interval);
    }
  }, []);

  const topTenQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), where('isTopTen', '==', true), limit(500));
  }, [firestore]);

  const { data: allTopProducts, loading } = useCollection<any>(topTenQuery);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);
  const { data: vendors } = useCollection<any>(vendorsQuery);

  const filteredTopProducts = useMemo(() => {
    if (!allTopProducts || !vendors) return [];
    
    return allTopProducts.filter(p => {
      const vendor = vendors.find(v => v.id === p.vendorId);
      
      // NUCLEAR STRICT ZONE ISOLATION:
      if (activeZoneId) {
        const pZone = p.zoneId;
        const vZone = vendor?.zoneId;
        if (pZone !== activeZoneId && vZone !== activeZoneId) {
          return false;
        }
      }
      return true;
    }).slice(0, 30);
  }, [allTopProducts, vendors, activeZoneId]);

  const navigateToProduct = (product: any) => {
    const slug = slugify(product.name);
    router.push(`/product/${slug}-${product.id}`);
  };

  if (loading && !allTopProducts) {
    return (
      <div className="py-6 px-4 flex space-x-4 overflow-x-auto no-scrollbar">
         {[1, 2, 3].map(i => (
           <div key={i} className="min-w-[160px] aspect-[2/3] bg-zinc-100 rounded-[2.5rem] p-4 flex flex-col justify-between shadow-sm">
             <Skeleton className="h-6 w-full bg-zinc-200" />
             <Skeleton className="flex-1 w-full my-4 rounded-2xl bg-zinc-200" />
             <Skeleton className="h-10 w-full bg-zinc-300" />
           </div>
         ))}
      </div>
    );
  }

  if (filteredTopProducts.length === 0) return null;

  return (
    <div className="py-6 overflow-hidden">
      <div className="px-6 mb-4 flex items-center justify-between">
        <h2 className="text-xl font-black italic uppercase tracking-tighter">
          Flash <span className="text-primary">Loot</span> Deals
        </h2>
        <div className="h-[2px] w-16 bg-primary/20 rounded-full" />
      </div>

      <div className="flex overflow-x-auto space-x-3 px-4 no-scrollbar pb-6">
        {filteredTopProducts.map((product, index) => {
          const imageUrl = product.imageUrl || `https://picsum.photos/seed/${product.id}/400/600`;
          const vendor = vendors?.find(v => v.id === product.vendorId);
          
          const scheduleOpen = isStoreScheduleOpen(vendor, currentMinutes);
          const isOffline = (vendor?.isOnline === false) || !scheduleOpen;
          
          const colorClass = CARD_COLORS[index % CARD_COLORS.length];
          
          return (
            <div 
              key={product.id} 
              className={cn(
                "relative min-w-[165px] aspect-[2/3.3] rounded-[2rem] p-3 flex flex-col items-center bg-gradient-to-b shadow-xl active:scale-95 transition-all cursor-pointer overflow-hidden",
                colorClass,
                isOffline && "grayscale opacity-80"
              )}
              onClick={() => !isOffline && navigateToProduct(product)}
            >
              <div className="w-full flex items-center justify-center gap-1 mb-2 relative z-10">
                 <div className="bg-red-600 p-0.5 rounded-full"><Megaphone className="h-2 w-2 text-white" /></div>
                 <div className="flex flex-col items-center">
                    <div className="flex items-center gap-0.5">
                       <Flame className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />
                       <span className="text-[7px] font-black text-white italic uppercase leading-none">SUPER</span>
                    </div>
                    <span className="text-[10px] font-black text-white italic uppercase leading-none tracking-tighter">LOOT DEALS</span>
                 </div>
                 <div className="bg-red-600 p-0.5 rounded-full"><Megaphone className="h-2 w-2 text-white -scale-x-100" /></div>
              </div>

              <div className="bg-white w-full py-1.5 px-3 rounded-2xl shadow-lg flex items-center justify-center mb-2.5 relative z-10 border border-white/20">
                 <span className="text-[10px] font-black text-black uppercase truncate tracking-tight">{product.name}</span>
              </div>

              <div className="flex-1 w-full relative bg-white rounded-[1.5rem] border-2 border-white/30 overflow-hidden mb-2.5 shadow-inner">
                <Image src={imageUrl} alt={product.name} fill className="object-cover" unoptimized />
                {isOffline && (
                  <div className="absolute inset-0 bg-black/60 z-30 flex items-center justify-center p-2">
                    <span className="text-white font-black text-[9px] uppercase border border-white/30 px-2 py-0.5 rounded-md">
                      {vendor?.isOnline === false ? 'OFFLINE' : 'CLOSED'}
                    </span>
                  </div>
                )}
              </div>

              <div className="w-full bg-[#1C1C1C] py-2.5 rounded-[1.25rem] border border-white/5 flex items-center justify-center relative z-10 shadow-lg">
                 <span className="text-[13px] font-black text-[#F1C40F] italic tracking-tight uppercase">
                    From ₹{product.price.toFixed(0)}
                 </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
