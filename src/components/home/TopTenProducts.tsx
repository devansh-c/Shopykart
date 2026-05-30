"use client"

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, limit } from "firebase/firestore"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/components/cart/CartProvider"
import { Plus } from "lucide-react"

export function TopTenProducts() {
  const firestore = useFirestore();
  const { addToCart } = useCart();

  const topTenQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'products'),
      where('isTopTen', '==', true),
      limit(10)
    );
  }, [firestore]);

  const { data: topProducts, loading } = useCollection<any>(topTenQuery);

  if (loading || !topProducts || topProducts.length === 0) return null;

  return (
    <div className="py-6 overflow-hidden content-visibility-auto">
      <div className="px-6 mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-foreground">
          Top <span className="text-primary">Ten</span> Specials
        </h2>
        <span className="text-[8px] font-black uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded-full tracking-[0.2em]">Trending Now</span>
      </div>

      <div className="flex overflow-x-auto space-x-12 px-8 no-scrollbar pb-8 pt-4">
        {topProducts.map((product, index) => {
          const imageUrl = product.imageUrl || `https://picsum.photos/seed/${product.id}/400/600`;
          
          return (
            <div key={product.id} className="relative min-w-[150px] group">
              <div 
                className="absolute -left-10 bottom-0 text-[160px] font-black leading-none select-none opacity-20 pointer-events-none transition-all group-hover:opacity-40"
                style={{ 
                  WebkitTextStroke: '2px #333', 
                  color: 'transparent',
                  fontStyle: 'italic',
                  zIndex: 0
                }}
              >
                {index + 1}
              </div>

              <div className="relative z-10 bg-white rounded-2xl overflow-hidden shadow-xl border border-border/40 transition-transform group-active:scale-95 will-change-transform">
                <Link href={`/product/view?id=${product.id}`}>
                  <div className="relative aspect-[3/4] w-full bg-muted">
                    <Image 
                      src={imageUrl} 
                      alt={product.name}
                      fill
                      className="object-cover"
                      priority={index < 2} // Improve above-the-fold visual stability
                      sizes="150px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                       <span className="bg-red-600 text-white text-[7px] font-black uppercase px-2 py-0.5 rounded shadow-lg block w-fit mb-1">RECENTLY ADDED</span>
                       <h3 className="text-white text-xs font-black uppercase italic leading-none truncate">{product.name}</h3>
                    </div>
                  </div>
                </Link>
                <button 
                  onClick={() => addToCart({ ...product, imageUrl })}
                  className="absolute top-2 right-2 bg-white/90 backdrop-blur-md p-1.5 rounded-lg text-primary shadow-lg active:scale-90 transition-transform"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
