
"use client"

import Image from 'next/image';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/cart/CartProvider';
import { cn } from '@/lib/utils';

type ProductCardProps = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  isVeg?: boolean;
  description?: string;
};

export function ProductCard({ id, name, price, imageUrl, isVeg = true, description }: ProductCardProps) {
  const { cart, addToCart, removeFromCart } = useCart();
  const quantity = cart.find(item => item.id === id)?.quantity || 0;

  return (
    <div className="bg-[#0B0B0B] rounded-[2rem] overflow-hidden group border border-white/5 shadow-2xl relative">
      <div className="relative h-40 w-full">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized
        />
        <div className="absolute top-2 left-2 flex items-center bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-lg border border-white/10 shadow-lg">
          <div className={cn(
            "h-2 w-2 rounded-sm mr-1",
            isVeg ? "bg-green-500" : "bg-red-500"
          )} />
          <span className="text-[8px] font-black text-white">{isVeg ? "VEG" : "NON-VEG"}</span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-black text-white text-sm uppercase italic line-clamp-1">{name}</h3>
        <p className="text-gray-400 text-[10px] line-clamp-2 mt-1 min-h-[1.5rem] italic">
          {description || "Premium ingredients."}
        </p>
        
        <div className="flex items-center justify-between mt-4">
          <span className="text-lg font-black text-primary italic">₹{price.toFixed(0)}</span>
          
          {quantity === 0 ? (
            <Button 
              size="sm" 
              className="rounded-xl px-4 h-9 font-black text-[10px] bg-primary hover:bg-primary/90 shadow-xl active:scale-95 transition-all"
              onClick={() => addToCart({ id, name, price, imageUrl })}
            >
              <Plus className="h-3 w-3 mr-1" />
              ADD
            </Button>
          ) : (
            <div className="flex items-center bg-primary text-white rounded-xl p-0.5 shadow-xl border border-white/20">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-white hover:bg-white/20"
                onClick={() => removeFromCart(id)}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="mx-1.5 font-black text-xs min-w-[1rem] text-center">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-white hover:bg-white/20"
                onClick={() => addToCart({ id, name, price, imageUrl })}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
