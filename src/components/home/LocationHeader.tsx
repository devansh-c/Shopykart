
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
    <div className="bg-[#0B0B0B] px-4 py-4 flex items-center justify-between gap-3">
      {/* Logo Section */}
      <Logo className="scale-90 flex-shrink-0" />

      {/* Integrated Search Bar */}
      <div className="relative flex-1 max-w-[180px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input 
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search" 
          className="h-10 bg-[#1A1A1A] border-none rounded-full pl-9 text-sm text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Cart Button */}
        <div className="relative">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <ShoppingBag className="h-6 w-6 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 h-5 w-5 bg-white rounded-full flex items-center justify-center border-2 border-[#0B0B0B]">
            <span className="text-[10px] font-black text-primary">{totalItems}</span>
          </div>
        </div>

        {/* Menu Button */}
        <div className="h-12 w-12 rounded-xl bg-[#1A1A1A] flex items-center justify-center border border-white/5">
          <Menu className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}
