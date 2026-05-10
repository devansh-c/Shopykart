
"use client"

import { Search, ShoppingBag, Menu } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { useCart } from '@/components/cart/CartProvider';
import { Input } from '@/components/ui/input';

type LocationHeaderProps = {
  searchValue: string;
  onSearchChange: (val: string) => void;
};

export function LocationHeader({ searchValue, onSearchChange }: LocationHeaderProps) {
  const { totalItems } = useCart();

  return (
    <div className="bg-[#0B0B0B] px-4 py-2.5 flex items-center justify-between gap-3 sticky top-0 z-50">
      {/* Logo Section */}
      <Logo className="flex-shrink-0" />

      {/* Integrated Search Bar */}
      <div className="relative flex-1 max-w-[160px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
        <Input 
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search" 
          className="h-8 bg-[#1A1A1A] border-none rounded-full pl-8 text-[12px] text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Cart Button */}
        <div className="relative">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shadow-lg">
            <ShoppingBag className="h-5 w-5 text-white" />
          </div>
          {totalItems > 0 && (
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-white rounded-full flex items-center justify-center border border-[#0B0B0B]">
              <span className="text-[9px] font-black text-primary">{totalItems}</span>
            </div>
          )}
        </div>

        {/* Menu Button */}
        <div className="h-9 w-9 rounded-lg bg-[#1A1A1A] flex items-center justify-center border border-white/5">
          <Menu className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}
