"use client"

import { useMemo } from 'react';
import { Zap, Plus, Minus, Heart } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCart } from '@/components/cart/CartProvider';
import { cn } from '@/lib/utils';

const popularProducts = [
  {
    id: 'p1',
    name: 'Cheese loaded French fries',
    price: 199.00,
    imageId: 'prod-fries',
    isVeg: true,
    category: 'fries',
    description: 'Crispy golden fries smothered in our secret triple-cheese blend.'
  },
  {
    id: 'p2',
    name: 'Chilli Attack Pasta',
    price: 249.00,
    imageId: 'prod-pasta-red',
    isVeg: true,
    category: 'pasta',
    description: 'Spicy red sauce penne with bird eye chillies and bell peppers.'
  },
  {
    id: 'p3',
    name: 'Penne Arrabiata (White Sauce)',
    price: 219.00,
    imageId: 'prod-pasta-white',
    isVeg: true,
    category: 'pasta',
    description: 'Classic creamy white sauce pasta with Italian herbs and garlic.'
  },
  {
    id: 'p4',
    name: 'Classic Veggie Burger',
    price: 149.00,
    imageId: 'prod-burger-classic',
    isVeg: true,
    category: 'burgers',
    description: 'Juicy vegetable patty with lettuce, tomatoes, and house mayo.'
  },
  {
    id: 'p5',
    name: 'Double Cheese Margherita',
    price: 399.00,
    imageId: 'prod-pizza-margherita',
    isVeg: true,
    category: 'pizza',
    description: 'A thin-crust delight with extra mozzarella and fresh basil.'
  },
  {
    id: 'p6',
    name: 'Virgin Mojito',
    price: 129.00,
    imageId: 'prod-drink-mojito',
    isVeg: true,
    category: 'drinks',
    description: 'Refreshing lime and mint cooler served over crushed ice.'
  }
];

type PopularProductsProps = {
  searchQuery?: string;
  category?: string;
};

export function PopularProducts({ searchQuery = '', category = 'all' }: PopularProductsProps) {
  const { cart, addToCart, removeFromCart, toggleWishlist, isInWishlist } = useCart();

  const filteredProducts = useMemo(() => {
    return popularProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = category === 'all' || product.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, category]);

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className="text-amber-500">
            <Zap className="h-6 w-6 fill-current" />
          </div>
          <h2 className="text-2xl font-black italic tracking-tighter">Trending Now</h2>
        </div>
        <button className="text-primary text-[11px] font-black uppercase tracking-widest underline underline-offset-4 decoration-2">See Catalog</button>
      </div>

      <div className="space-y-5">
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
                className="bg-white rounded-[2rem] p-5 flex justify-between items-center group active:scale-[0.99] transition-all shadow-sm border border-border/40 relative"
              >
                <button 
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute top-4 left-4 z-10 p-1.5 rounded-full bg-white/80 shadow-sm"
                >
                  <Heart className={cn("h-4 w-4 transition-colors", liked ? "fill-primary text-primary" : "text-gray-300")} />
                </button>

                <div className="flex-1 pr-4">
                  <div className="mb-2">
                    <div className="h-4 w-4 border-2 border-green-600 rounded-sm flex items-center justify-center p-0.5">
                      <div className="h-full w-full bg-green-600 rounded-full" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg leading-tight mb-2 text-foreground">{product.name}</h3>
                  <div className="text-xl font-bold">₹{product.price.toFixed(2)}</div>
                </div>
                
                <div className="relative w-32 h-32 flex-shrink-0">
                  <div className="w-full h-full rounded-2xl overflow-hidden bg-muted border border-border/20">
                    <img 
                      src={imageUrl} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-full px-2">
                    {quantity === 0 ? (
                      <button 
                        onClick={() => addToCart({ ...product, imageUrl })}
                        className="w-full h-10 bg-white text-primary border border-primary shadow-lg font-black text-xs rounded-xl active:scale-95 transition-all"
                      >
                        ADD +
                      </button>
                    ) : (
                      <div className="flex items-center justify-between w-full h-10 bg-primary text-primary-foreground rounded-xl shadow-lg overflow-hidden">
                        <button 
                          onClick={() => removeFromCart(product.id)}
                          className="flex-1 flex items-center justify-center hover:bg-white/10 h-full"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-black min-w-[20px] text-center">{quantity}</span>
                        <button 
                          onClick={() => addToCart({ ...product, imageUrl })}
                          className="flex-1 flex items-center justify-center hover:bg-white/10 h-full"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground text-sm font-medium italic">No products matched your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
