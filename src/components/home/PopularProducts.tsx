"use client"

import { useMemo } from 'react';
import { Zap, Plus, Minus, Heart, Star } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCart } from '@/components/cart/CartProvider';
import { cn } from '@/lib/utils';
import { allProducts } from '@/lib/mock-data';
import Link from 'next/link';

type PopularProductsProps = {
  searchQuery?: string;
  category?: string;
};

export function PopularProducts({ searchQuery = '', category = 'all' }: PopularProductsProps) {
  const { cart, addToCart, removeFromCart, toggleWishlist, isInWishlist } = useCart();

  const filteredProducts = useMemo(() => {
    return allProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = category === 'all' || product.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, category]);

  return (
    <div className="px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <div className="text-amber-500">
              <Zap className="h-6 w-6 fill-current" />
            </div>
            <h2 className="text-3xl font-black italic tracking-tighter text-headline">Trending Now</h2>
          </div>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Our most ordered delights</p>
        </div>
        <Link href="/menu" className="text-primary text-[11px] font-black uppercase tracking-widest underline underline-offset-8 decoration-2 hover:text-primary/80 transition-colors">See Catalog</Link>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const img = PlaceHolderImages.find(p => p.id === product.imageId);
            const imageUrl = img?.imageUrl || "https://picsum.photos/seed/food/300/300";
            const cartItem = cart.find(item => item.id === product.id);
            const quantity = cartItem?.quantity || 0;
            const liked = isInWishlist(product.id);

            return (
              <div 
                key={product.id}
                className="premium-card p-6 flex justify-between items-center group relative overflow-hidden"
              >
                {/* Wishlist Button */}
                <button 
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute top-4 left-4 z-10 p-2.5 rounded-full bg-white/90 shadow-xl backdrop-blur-sm active:scale-75 transition-all"
                >
                  <Heart className={cn("h-4 w-4 transition-colors", liked ? "fill-primary text-primary" : "text-gray-300")} />
                </button>

                <div className="flex-1 pr-6">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-green-600 rounded-sm flex items-center justify-center p-0.5">
                      <div className="h-full w-full bg-green-600 rounded-full" />
                    </div>
                    <div className="flex items-center text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">
                      <Star className="h-3 w-3 fill-current mr-1" />
                      4.9 (1.2k)
                    </div>
                  </div>
                  <Link href={`/product/${product.id}`}>
                    <h3 className="font-black text-xl leading-tight mb-2 text-foreground group-hover:text-primary transition-colors italic tracking-tight">{product.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-4 font-medium">{product.description}</p>
                    <div className="text-2xl font-black text-foreground italic tracking-tighter">₹{product.price.toFixed(2)}</div>
                  </Link>
                </div>
                
                <div className="relative w-36 h-36 flex-shrink-0">
                  <Link href={`/product/${product.id}`} className="block w-full h-full rounded-3xl overflow-hidden bg-muted shadow-inner">
                    <img 
                      src={imageUrl} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                  </Link>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[85%]">
                    {quantity === 0 ? (
                      <button 
                        onClick={() => addToCart({ ...product, imageUrl })}
                        className="w-full h-11 bg-white text-primary border-2 border-primary shadow-[0_10px_20px_rgba(220,38,38,0.15)] font-black text-[10px] uppercase tracking-widest rounded-2xl active:scale-95 transition-all"
                      >
                        ADD TO BAG
                      </button>
                    ) : (
                      <div className="flex items-center justify-between w-full h-11 bg-primary text-primary-foreground rounded-2xl shadow-xl shadow-primary/20 overflow-hidden">
                        <button 
                          onClick={() => removeFromCart(product.id)}
                          className="flex-1 flex items-center justify-center hover:bg-white/10 h-full transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-black min-w-[30px] text-center">{quantity}</span>
                        <button 
                          onClick={() => addToCart({ ...product, imageUrl })}
                          className="flex-1 flex items-center justify-center hover:bg-white/10 h-full transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-[2rem] border-2 border-dashed border-muted">
            <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">No culinary matches found</p>
          </div>
        )}
      </div>
    </div>
  );
}
