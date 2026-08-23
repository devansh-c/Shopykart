"use client"

import { useCart } from '@/components/cart/CartProvider';
import { Heart, Plus, ChevronLeft, Loader2, Store, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { ProductQuickView } from '@/components/product/ProductQuickView';
import { cn } from '@/lib/utils';

/**
 * @fileOverview WishlistPage updated to filter out deleted products globally.
 */
export default function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart } = useCart();
  const router = useRouter();

  const firestore = useFirestore();
  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);
  
  const { data: dbProducts, loading } = useCollection<any>(productsQuery);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);
  const { data: vendors } = useCollection<any>(vendorsQuery);

  // STRICT FILTER: Check if product ID is in wishlist AND is not marked as deleted
  const favoriteProducts = dbProducts?.filter(p => wishlist.includes(p.id) && !p.isDeleted) || [];

  if (loading && !dbProducts) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (favoriteProducts.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-50 h-32 w-32 rounded-full flex items-center justify-center mb-6">
          <Heart className="h-12 w-12 text-primary fill-primary/20" />
        </div>
        <h2 className="text-2xl font-black italic uppercase">No Favorites Yet</h2>
        <p className="text-muted-foreground mt-2 mb-8">Tap the heart on any item to save it for later.</p>
        <button 
          onClick={() => router.push('/menu')} 
          className="bg-primary text-white rounded-2xl h-12 px-8 font-black uppercase italic tracking-tighter"
        >
          EXPLORE MENU
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-32">
      <div className="bg-white sticky top-0 z-10 border-b border-border/50 px-4 py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-muted">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-black italic uppercase tracking-tight">WISHLIST</h1>
        <div className="w-10" />
      </div>

      <div className="grid grid-cols-2 gap-4 p-4">
        {favoriteProducts.map((product) => {
          const imageUrl = product.imageUrl || `https://picsum.photos/seed/${product.id}/400/400`;
          const vendor = vendors?.find(v => v.id === product.vendorId);
          const isOffline = vendor?.isOnline === false || product.isAvailable === false;

          return (
            <div key={product.id} className={cn(
              "bg-white rounded-2xl overflow-hidden shadow-sm border border-border/40 flex flex-col group animate-in fade-in zoom-in duration-300 transition-all",
              isOffline && "opacity-80"
            )}>
              <div className="relative aspect-square">
                <ProductQuickView product={product}>
                  <button className="relative w-full h-full">
                    <Image src={imageUrl} alt={product.name} fill className={cn("object-cover group-hover:scale-105 transition-transform", isOffline && "grayscale")} unoptimized />
                    {isOffline && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4 text-center z-10">
                        <Store className="h-6 w-6 text-white/80 mb-2" />
                        <span className="text-white font-black text-[10px] uppercase italic border border-white/30 px-2 py-1 rounded-lg backdrop-blur-sm">Closed Now</span>
                      </div>
                    )}
                  </button>
                </ProductQuickView>
                <button 
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-sm text-primary z-20"
                >
                  <Heart className="h-4 w-4 fill-primary" />
                </button>
              </div>
              <div className="p-3 flex-1 flex flex-col justify-between">
                <ProductQuickView product={product}>
                  <button className="text-left block w-full">
                    <h3 className="font-bold text-xs line-clamp-2 min-h-[2rem] leading-tight mb-1">{product.name}</h3>
                    <p className="text-primary font-black text-sm">₹{product.price.toFixed(2)}</p>
                  </button>
                </ProductQuickView>
                
                {isOffline ? (
                  <div className="mt-3 w-full bg-gray-100 text-gray-400 text-[8px] font-black h-8 rounded-xl flex items-center justify-center gap-1 italic border border-gray-200">
                    <AlertCircle className="h-2.5 w-2.5" /> STORE OFFLINE
                  </div>
                ) : (
                  <button 
                    onClick={() => addToCart({ ...product, imageUrl })}
                    className="mt-3 w-full bg-primary text-white text-[10px] font-black h-8 rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all"
                  >
                    <Plus className="h-3 w-3" />
                    ADD TO CART
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