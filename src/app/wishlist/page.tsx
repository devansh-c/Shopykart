
"use client"

import { useCart } from '@/components/cart/CartProvider';
import { BottomNav } from '@/components/shared/BottomNav';
import { Heart, Plus, ChevronLeft, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

export default function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart } = useCart();
  const router = useRouter();

  const firestore = useFirestore();
  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);
  
  const { data: dbProducts, loading } = useCollection<any>(productsQuery);

  const favoriteProducts = dbProducts?.filter(p => wishlist.includes(p.id)) || [];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (favoriteProducts.length === 0) {
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
        <BottomNav />
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

          return (
            <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border/40 flex flex-col group animate-in fade-in zoom-in duration-300">
              <div className="relative aspect-square">
                <Link href={`/product/${product.id}`}>
                  <Image src={imageUrl} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform" />
                </Link>
                <button 
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-sm text-primary"
                >
                  <Heart className="h-4 w-4 fill-primary" />
                </button>
              </div>
              <div className="p-3 flex-1 flex flex-col justify-between">
                <Link href={`/product/${product.id}`}>
                  <h3 className="font-bold text-xs line-clamp-2 min-h-[2rem] leading-tight mb-1">{product.name}</h3>
                  <p className="text-primary font-black text-sm">₹{product.price.toFixed(2)}</p>
                </Link>
                <button 
                  onClick={() => addToCart({ ...product, imageUrl })}
                  className="mt-3 w-full bg-primary text-white text-[10px] font-black h-8 rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all"
                >
                  <Plus className="h-3 w-3" />
                  ADD TO CART
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}
