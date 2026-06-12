
"use client"

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, limit } from "firebase/firestore"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/components/cart/CartProvider"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect, useMemo } from "react"

/**
 * @fileOverview TopTenProducts with optimized strict location filtering.
 */
export function TopTenProducts() {
  const firestore = useFirestore();
  const { addToCart } = useCart();
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

  // Increased limit for global fetching
  const topTenQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), where('isTopTen', '==', true), limit(100));
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
      
      // HUB ISOLATION
      const vendorCategory = vendor?.category || 'Food';
      const productMode = p.serviceMode || vendorCategory;
      if (productMode !== 'Food') return false;

      // STRICT LOCATION FILTERING
      const productZoneId = p.zoneId || vendor?.zoneId;
      const productTown = (p.town || vendor?.town || '').toLowerCase().trim();

      if (activeZoneId || targetCityNormalized) {
        const matchesId = activeZoneId && productZoneId === activeZoneId;
        const matchesTown = targetCityNormalized && (
          productTown === targetCityNormalized || 
          productTown.startsWith(targetCityNormalized) ||
          targetCityNormalized.startsWith(productTown)
        );
        
        // Hide if mixing between cities
        if (targetCityNormalized === 'ranipur' && productTown === 'mauranipur') return false;
        if (targetCityNormalized === 'mauranipur' && productTown === 'ranipur') return false;

        const isUnassigned = !productZoneId && (!productTown || productTown === '' || productTown === 'local');
        
        if (!matchesId && !matchesTown && !isUnassigned) return false;
      }
      return true;
    }).slice(0, 10);
  }, [allTopProducts, vendors, activeZoneId, activeCity]);

  if (loading || filteredTopProducts.length === 0) return null;

  return (
    <div className="py-6 overflow-hidden content-visibility-auto">
      <div className="px-6 mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-foreground">
          Top <span className="text-primary">Ten</span> Specials
        </h2>
      </div>

      <div className="flex overflow-x-auto space-x-12 px-8 no-scrollbar pb-8 pt-4">
        {filteredTopProducts.map((product, index) => {
          const imageUrl = product.imageUrl || `https://picsum.photos/seed/${product.id}/400/600`;
          const vendor = vendors?.find(v => v.id === product.vendorId);
          const isOffline = (vendor?.isOnline === false) || (product.isAvailable === false);
          
          return (
            <div key={product.id} className={cn(
              "relative min-w-[150px] group transition-all duration-300",
              isOffline && "grayscale opacity-80"
            )}>
              <div 
                className="absolute -left-10 bottom-0 text-[160px] font-black leading-none select-none opacity-20 pointer-events-none"
                style={{ WebkitTextStroke: '2px #333', color: 'transparent', fontStyle: 'italic', zIndex: 0 }}
              >
                {index + 1}
              </div>

              <div className="relative z-10 bg-white rounded-2xl overflow-hidden shadow-xl border border-border/40 group-active:scale-95">
                <Link href={isOffline ? '#' : `/product/view?id=${product.id}`} className={cn(isOffline && "pointer-events-none")}>
                  <div className="relative aspect-[3/4] w-full bg-muted">
                    <Image src={imageUrl} alt={product.name} fill className="object-cover" unoptimized />
                    {isOffline && (
                      <div className="absolute inset-0 bg-black/60 z-30 flex items-center justify-center p-2">
                        <span className="text-white font-black text-[10px] uppercase italic tracking-tighter border-2 border-white/30 px-2 py-1 rounded-lg backdrop-blur-sm">Closed</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                       <h3 className="text-white text-xs font-black uppercase italic leading-none truncate">{product.name}</h3>
                    </div>
                  </div>
                </Link>
                {!isOffline && (
                  <button onClick={() => addToCart({ ...product, imageUrl })} className="absolute top-2 right-2 bg-white/90 backdrop-blur-md p-1.5 rounded-lg text-primary shadow-lg">
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
