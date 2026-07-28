'use client';

import {
  Search,
  Camera,
  Mic,
  MapPin,
  ChevronDown,
  Menu
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

/**
 * @fileOverview Compact Premium Header Component with Hamburger Menu.
 */
export function LocationHeader({
  searchValue,
  onSearchChange,
}: {
  searchValue: string;
  onSearchChange: (val: string) => void;
  activeMode: string;
  onModeChange: (mode: string) => void;
}) {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [currentAddress, setCurrentAddress] = useState('Ranipur');

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: profile } = useDoc<any>(profileRef);

  useEffect(() => {
    const updateAddress = () => {
      const saved = localStorage.getItem('user_address');
      if (saved) setCurrentAddress(saved);
    };
    updateAddress();
    window.addEventListener('user-address-updated', updateAddress);
    return () => window.removeEventListener('user-address-updated', updateAddress);
  }, []);

  return (
    <div className="w-full bg-white pb-4 pt-3 px-4 space-y-3 rounded-b-[2.5rem] shadow-sm relative z-50 overflow-hidden">
      {/* Subtle Food Pattern Background */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23 47c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5z' fill='%23000000' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: '100px'
        }} 
      />

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-location-picker'))}>
          <MapPin className="h-4.5 w-4.5 text-black stroke-[2.5]" />
          <div className="flex items-center gap-1">
            <span className="text-black text-base font-black tracking-tight">{currentAddress}</span>
            <ChevronDown className="h-3.5 w-3.5 text-black/60" />
          </div>
        </div>

        <button 
          onClick={() => router.push('/profile')}
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-100 shadow-sm active:scale-90 transition-all hover:bg-gray-100"
          aria-label="Open Profile Menu"
        >
          <Menu className="h-6 w-6 text-black" />
        </button>
      </div>

      {/* Compact Pill Search Bar */}
      <div className="relative group relative z-10">
        <div className="relative h-12 w-full bg-gradient-to-r from-[#D9C4A9] via-[#F1E4D1] to-[#D9C4A9] rounded-full overflow-hidden shadow-md border border-[#B8A38B]/20 flex items-center px-4">
          <Search className="h-5 w-5 text-[#5C4D3C] shrink-0" />
          
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search for Food or Groceries"
            className="h-full w-full bg-transparent border-none pl-2 pr-16 text-[#2D2418] font-bold placeholder:text-[#8C7A63] focus-visible:ring-0 text-xs tracking-tight"
          />
          
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-3 text-[#2D2418]">
             <button className="active:scale-90 transition-all">
                <Camera className="h-5 w-5 stroke-[2.5]" />
             </button>
             <button className="active:scale-90 transition-all">
                <Mic className="h-5 w-5 stroke-[2.5]" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
