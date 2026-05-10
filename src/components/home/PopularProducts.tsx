"use client"

import { Zap, Plus, Minus } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCart } from '@/components/cart/CartProvider';
import { Button } from '@/components/ui/button';
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
  const { cart, addToCart, removeFromCart } = useCart();

  const filteredProducts = popularProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = category === 'all' || product.category === category;
    return matchesSearch && matchesCategory;
  });

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

            return (
              <div 
                key={product.id}
                className="bg-white rounded-2xl p-4 flex justify-between items-center group active:scale-[0.99] transition-all shadow-sm border border-border/40"
              >
                <div className="flex-1 pr-4">
                  <div className="mb-2">
                    <div className="h-3.5 w-3.5 border border-green-600 rounded-sm flex items-center justify-center p-0.5">
                      <div className="h-full w-full bg-green-600 rounded-sm" />
                    </div>
                  </div>
                  <h3 className="font-bold text-base leading-tight mb-1">{product.name}</h3>
                  <p className="text-[11px] text-muted-foreground mb-3 line-clamp-1 italic font-medium">{product.description}</p>
                  <div className="text-lg font-black italic">₹{product.price.toFixed(2)}</div>
                </div>
                
                <div className="relative w-28 h-28 flex-shrink-0">
                  <div className="w-full h-full rounded-2xl overflow-hidden border border-border/20">
                    <img 
                      src={imageUrl} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-full px-3">
                    {quantity === 0 ? (
                      <Button 
                        onClick={() => addToCart({ id: product.id, name: product.name, price: product.price, imageUrl })}
                        className="w-full h-8 bg-white text-primary border border-primary hover:bg-primary hover:text-white font-black text-[10px] rounded-xl shadow-lg transition-all"
                      >
                        ADD +
                      </Button>
                    ) : (
                      <div className="flex items-center justify-between w-full h-8 bg-primary text-primary-foreground rounded-xl shadow-lg overflow-hidden">
                        <button 
                          onClick={() => removeFromCart(product.id)}
                          className="flex-1 flex items-center justify-center hover:bg-white/10 h-full"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-black min-w-[20px] text-center">{quantity}</span>
                        <button 
                          onClick={() => addToCart({ id: product.id, name: product.name, price: product.price, imageUrl })}
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
            <p className="text-muted-foreground text-sm font-medium">No matches found</p>
          </div>
        )}
      </div>
    </div>
  );
}
