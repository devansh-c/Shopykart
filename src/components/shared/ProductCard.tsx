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
    <div className="premium-card overflow-hidden group border border-border/40">
      <div className="relative h-40 w-full">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          data-ai-hint="food dish"
        />
        <div className="absolute top-2 left-2 flex items-center bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded shadow-sm">
          <div className={cn(
            "h-2 w-2 rounded-sm mr-1",
            isVeg ? "bg-green-500" : "bg-red-500"
          )} />
          <span className="text-[8px] font-bold text-gray-700">{isVeg ? "VEG" : "NON-VEG"}</span>
        </div>
      </div>
      
      <div className="p-3">
        <h3 className="font-bold text-sm line-clamp-1">{name}</h3>
        <p className="text-muted-foreground text-[10px] line-clamp-2 mt-0.5 min-h-[1.5rem]">
          {description || "Premium ingredients."}
        </p>
        
        <div className="flex items-center justify-between mt-3">
          <span className="text-base font-bold text-primary">₹{price.toFixed(2)}</span>
          
          {quantity === 0 ? (
            <Button 
              size="sm" 
              className="rounded-md px-3 h-8 font-bold text-[10px] bg-primary hover:bg-primary/90 shadow-sm active:scale-95 transition-all"
              onClick={() => addToCart({ id, name, price, imageUrl })}
            >
              <Plus className="h-3 w-3 mr-1" />
              ADD
            </Button>
          ) : (
            <div className="flex items-center bg-primary text-primary-foreground rounded-md p-0.5 shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-sm text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
                onClick={() => removeFromCart(id)}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="mx-1.5 font-bold text-xs min-w-[1rem] text-center">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-sm text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
                onClick={() => addToCart({ id, name, price, imageUrl })}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
