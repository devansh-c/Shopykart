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
    <div className="premium-card overflow-hidden group">
      <div className="relative h-44 w-full overflow-hidden">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          data-ai-hint="food dish"
        />
        <div className="absolute top-3 left-3 flex items-center bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
          <div className={cn(
            "h-2.5 w-2.5 rounded-full mr-1.5",
            isVeg ? "bg-green-500" : "bg-red-500"
          )} />
          <span className="text-[10px] font-bold text-gray-700">{isVeg ? "VEG" : "NON-VEG"}</span>
        </div>
      </div>
      
      <div className="p-4 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-base line-clamp-1">{name}</h3>
          <p className="text-muted-foreground text-xs line-clamp-2 mt-1 min-h-[2rem]">
            {description || "A delicious meal prepared with the finest ingredients."}
          </p>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <span className="text-lg font-bold text-primary">${price.toFixed(2)}</span>
          
          {quantity === 0 ? (
            <Button 
              size="sm" 
              className="rounded-full px-4 h-9 font-bold bg-primary hover:bg-primary/90 shadow-md active:scale-95 transition-all"
              onClick={() => addToCart({ id, name, price, imageUrl })}
            >
              <Plus className="h-4 w-4 mr-1" />
              ADD
            </Button>
          ) : (
            <div className="flex items-center bg-primary text-primary-foreground rounded-full p-0.5 shadow-md">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
                onClick={() => removeFromCart(id)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="mx-2 font-bold min-w-[1rem] text-center">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
                onClick={() => addToCart({ id, name, price, imageUrl })}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}