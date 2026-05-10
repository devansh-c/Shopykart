"use client"

import { Search, ShoppingBag, Menu, Heart } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { useCart } from '@/components/cart/CartProvider';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

type LocationHeaderProps = {
  searchValue: string;
  onSearchChange: (val: string) => void;
};

export function LocationHeader({ searchValue, onSearchChange }: LocationHeaderProps) {
  const { totalItems } = useCart();

  return (
    <div className="bg-[#0B0B0B] px-4 py-4 flex flex-col gap-4 sticky top-0 z-50 shadow-2xl">
      <div className="flex items-center justify-between gap-3">
        {/* Logo Section */}
        <Logo className="flex-shrink-0" />

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Wishlist Button */}
          <Link href="/wishlist">
            <div className="h-10 w-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center border border-white/5 active:scale-90 transition-all">
              <Heart className="h-4 w-4 text-white" />
            </div>
          </Link>

          {/* Cart Button */}
          <Link href="/cart">
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 transition-all">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
              {totalItems > 0 && (
                <div className="absolute -top-1 -right-1 h-5 w-5 bg-white rounded-full flex items-center justify-center border-2 border-[#0B0B0B] animate-in zoom-in">
                  <span className="text-[10px] font-black text-primary">{totalItems}</span>
                </div>
              )}
            </div>
          </Link>

          {/* Menu Button */}
          <div className="h-10 w-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center border border-white/5 active:scale-90 transition-all">
            <Menu className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>

      {/* Integrated Search Bar */}
      <div className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input 
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search for your favorites..." 
          className="h-12 bg-[#1A1A1A] border-none rounded-2xl pl-11 text-sm text-white placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:ring-offset-0 transition-all"
        />
      </div>
    </div>
  );
}
