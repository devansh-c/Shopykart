
"use client"

import { Zap } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCart } from '@/components/cart/CartProvider';
import { Button } from '@/components/ui/button';

const popularProducts = [
  {
    id: 'p1',
    name: 'Cheese loaded French fries',
    price: 199.00,
    imageId: 'prod-fries',
    isVeg: true
  },
  {
    id: 'p2',
    name: 'Chilli Attack Pasta',
    price: 249.00,
    imageId: 'prod-pasta-red',
    isVeg: true
  },
  {
    id: 'p3',
    name: 'Penne Arrabiata (White Sauce) Pasta',
    price: 219.00,
    imageId: 'prod-pasta-white',
    isVeg: true
  }
];

export function PopularProducts() {
  const { addToCart } = useCart();

  return (
    <div className="px-4 py-6">
      <div className="flex items-center space-x-2 mb-6">
        <div className="text-amber-500">
          <Zap className="h-5 w-5 fill-current" />
        </div>
        <h2 className="text-xl font-black">Popular Right Now</h2>
      </div>

      <div className="space-y-4">
        {popularProducts.map((product) => {
          const img = PlaceHolderImages.find(p => p.id === product.imageId);
          const imageUrl = img?.imageUrl || "https://picsum.photos/seed/food/300/300";

          return (
            <div 
              key={product.id}
              className="premium-card bg-white p-4 flex justify-between items-center group active:scale-[0.99] transition-all"
            >
              <div className="flex-1 pr-4">
                <div className="mb-2">
                  <div className="h-4 w-4 border-2 border-green-600 rounded-sm flex items-center justify-center p-0.5">
                    <div className="h-full w-full bg-green-600 rounded-full" />
                  </div>
                </div>
                <h3 className="font-bold text-base leading-tight mb-2">{product.name}</h3>
                <div className="text-lg font-black">₹{product.price.toFixed(2)}</div>
              </div>
              
              <div className="relative w-32 h-32 flex-shrink-0">
                <div className="w-full h-full rounded-2xl overflow-hidden shadow-sm">
                  <img 
                    src={imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-full px-2">
                  <Button 
                    onClick={() => addToCart({ id: product.id, name: product.name, price: product.price, imageUrl })}
                    className="w-full h-9 bg-white text-primary border border-primary hover:bg-primary/5 font-black text-sm rounded-xl shadow-md"
                  >
                    ADD +
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
