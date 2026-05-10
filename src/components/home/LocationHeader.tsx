"use client"

import { MapPin, ChevronDown, ShoppingBag } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCart } from '@/components/cart/CartProvider';

export function LocationHeader() {
  const { totalItems } = useCart();

  return (
    <div className="bg-[#121212] px-4 pt-8 pb-10 rounded-b-xl">
      <div className="flex items-center justify-between">
        <Logo className="scale-90 origin-left" />

        <div className="flex flex-col items-start ml-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">
            Store Location
          </span>
          <div className="flex items-center space-x-1">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-white truncate max-w-[100px]">Bun Bur...</span>
            <ChevronDown className="h-3 w-3 text-gray-400" />
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center border border-white/5">
            <ShoppingBag className="h-5 w-5 text-white" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold h-4 w-4 rounded-md flex items-center justify-center border-2 border-[#121212]">
                {totalItems}
              </span>
            )}
          </div>
          <Avatar className="h-10 w-10 rounded-lg border-2 border-white/10">
            <AvatarImage src="https://picsum.photos/seed/user-avatar/100/100" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}
