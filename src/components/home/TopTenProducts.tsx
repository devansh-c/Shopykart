
"use client"

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, limit } from "firebase/firestore"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useCart } from "@/components/cart/CartProvider"
import { Plus, Flame, Megaphone, Trophy, Sparkles, Zap, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect, useMemo } from "react"
import { Skeleton } from "@/components/ui/skeleton"

const CARD_COLORS = [
  "from-blue-600 to-blue-800",
  "from-green-600 to-green-800",
  "from-purple-600 to-purple-800",
  "from-orange-500 to-orange-700",
  "from-rose-600 to-rose-800",
];

export function TopTenProducts() {
  const firestore = useFirestore();
  const { addToCart } = useCart();
  const router = useRouter();
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [activeCity, setActiveCity] = useState<string | null>(null);

  useEffect(() => {
    const updateZone = () => {
      setActiveZoneId(localStorage.getItem('active_zone_id'));
      setActiveCity(localStorage.getItem('user_city'));
    };
    updateZone();
    window.addEventListener('user-address-updated', updateZone);
    return () => window.removeEventListener('user-address-updated', updateZone);
  }, []);

  const topTenQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), where('isTopTen', '==', true), limit(50));
  }, [firestore]);

  const { data: allTopProducts, loading } = useCollection<any>(topTenQuery);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);
  const { data: vendors } = useCollection<any>(vendorsQuery);

  const filteredTopProducts = useMemo(() => {
    if (!allTopProducts || !vendors) return [];
    const targetCityNormalized = (activeCity || '').toLowerCase().trim();

    return allTopProducts.filter(p => {
      const vendor = vendors.find(v => v.id === p.vendorId);
      const productMode = p.serviceMode || vendor?.category || 'Food';
      if (productMode !== 'Food') return false;

      const productTown = (p.town || vendor?.town || '').toLowerCase().trim();
      if (activeZoneId || targetCityNormalized) {
        if (targetCityNormalized === 'ranipur' && productTown === 'mauranipur') return false;
        if (targetCityNormalized === 'mauranipur' && productTown === 'ranipur') return false;
      }
      return true;
    }).slice(0, 10);
  }, [allTopProducts, vendors, activeZoneId, activeCity]);

  if (loading && !allTopProducts) {
    return (
      <div className="py-6 px-4 flex space-x-4 overflow-x-auto no-scrollbar">
         {[1, 2, 3].map(i => (
           <div key={i} className="min-w-[160px] aspect-[2/3] bg-gray-100 rounded-[2rem] animate-pulse" />
         ))}
      </div>
    );
  }

  return (
    <div className="py-6 overflow-hidden">
      <div className="px-6 mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter">
          Flash <span className="text-primary">Loot</span> Deals
        </h2>
        <div className="h-1 w-12 bg-primary/20 rounded-full" />
      </div>

      <div className="flex overflow-x-auto space-x-4 px-6 no-scrollbar pb-8 pt-2">
        {/* SPECIAL GAME/PROMO CARD - MATCHING SCREENSHOT */}
        <div 
          onClick={() => window.dispatchEvent(new CustomEvent('open-promo-popup'))}
          className="relative min-w-[170px] aspect-[2/3.2] rounded-[2.5rem] p-5 flex flex-col items-center justify-between bg-gradient-to-b from-amber-400 to-amber-600 shadow-2xl shadow-amber-200 border-4 border-white/20 active:scale-95 transition-all cursor-pointer overflow-hidden group"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 to-transparent opacity-50" />
          
          <div className="relative z-10 text-center space-y-1">
             <div className="flex items-center justify-center gap-1">
                <span className="text-2xl font-black text-white italic tracking-tighter">WIN</span>
                <div className="bg-white/20 p-1 rounded-full"><Zap className="h-4 w-4 text-white fill-white" /></div>
                <span className="text-2xl font-black text-white italic tracking-tighter">150</span>
             </div>
             <p className="text-[11px] font-black text-white/80 uppercase tracking-widest leading-none">Play Now</p>
          </div>

          <div className="relative z-10 w-full aspect-square bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-4 flex flex-col items-center justify-center group-hover:rotate-3 transition-transform">
             <div className="relative h-20 w-20">
                <Image src="https://picsum.photos/seed/gamematch/200/200" alt="Game" fill className="object-contain" unoptimized />
             </div>
             <div className="mt-2 bg-white px-3 py-1 rounded-lg">
                <span className="text-[8px] font-black text-amber-600 uppercase tracking-tighter">Grocery Match</span>
             </div>
          </div>

          <div className="relative z-10 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
             <Trophy className="h-3 w-3 text-amber-300" />
             <span className="text-[10px] font-black text-white italic">PLAY NOW</span>
          </div>
        </div>

        {/* TOP TEN PRODUCT CARDS */}
        {filteredTopProducts.map((product, index) => {
          const imageUrl = product.imageUrl || `https://picsum.photos/seed/${product.id}/400/600`;
          const vendor = vendors?.find(v => v.id === product.vendorId);
          const isOffline = (vendor?.isOnline === false) || (product.isAvailable === false);
          const colorClass = CARD_COLORS[index % CARD_COLORS.length];
          
          return (
            <div 
              key={product.id} 
              className={cn(
                "relative min-w-[170px] aspect-[2/3.2] rounded-[2.5rem] p-4 flex flex-col items-center bg-gradient-to-b shadow-2xl border-4 border-white/10 active:scale-95 transition-all cursor-pointer overflow-hidden group",
                colorClass,
                isOffline && "grayscale opacity-80"
              )}
              onClick={() => !isOffline && router.push(`/product/view?id=${product.id}`)}
            >
              {/* SUPER LOOT DEALS HEADER */}
              <div className="w-full flex items-center justify-center gap-1.5 mb-2 relative z-10">
                 <div className="bg-red-600 p-1 rounded-full shadow-lg"><Megaphone className="h-2.5 w-2.5 text-white" /></div>
                 <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1">
                       <Flame className="h-3 w-3 text-amber-400 fill-amber-400 animate-pulse" />
                       <span className="text-[9px] font-black text-white italic uppercase tracking-tighter leading-none">SUPER</span>
                    </div>
                    <span className="text-[11px] font-black text-white italic uppercase tracking-tighter leading-none">LOOT DEALS</span>
                 </div>
                 <div className="bg-red-600 p-1 rounded-full shadow-lg"><Megaphone className="h-2.5 w-2.5 text-white -scale-x-100" /></div>
              </div>

              {/* PRODUCT NAME BADGE */}
              <div className="bg-white w-full py-1.5 px-3 rounded-2xl shadow-xl flex items-center justify-center mb-3 relative z-10">
                 <span className="text-[10px] font-black text-black uppercase truncate tracking-tight">{product.name}</span>
              </div>

              {/* IMAGE CONTAINER */}
              <div className="flex-1 w-full relative bg-white/10 backdrop-blur-sm rounded-[2rem] border border-white/20 overflow-hidden mb-3 group-hover:scale-[1.02] transition-transform">
                <Image src={imageUrl} alt={product.name} fill className="object-cover" unoptimized />
                {isOffline && (
                  <div className="absolute inset-0 bg-black/60 z-30 flex items-center justify-center p-2">
                    <span className="text-white font-black text-[10px] uppercase border border-white/30 px-2 py-1 rounded-lg">Closed</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              </div>

              {/* PRICE TAG (MATCHING SCREENSHOT) */}
              <div className="w-full bg-black/40 backdrop-blur-md py-2.5 rounded-2xl border border-white/10 flex items-center justify-center relative z-10">
                 <span className="text-sm font-black text-amber-400 italic tracking-tight">From ₹{product.price}</span>
              </div>

              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
