'use client';

import {
  Search,
  Camera,
  Mic,
  MapPin,
  ChevronDown
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * @fileOverview Premium Header Component
 * Matches the requested design with a metallic champagne search bar and subtle pattern background.
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
    <div className="w-full bg-white pb-6 pt-4 px-4 space-y-5 rounded-b-[3rem] shadow-sm relative z-50 overflow-hidden">
      {/* Subtle Food Pattern Background */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23 47c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5z' fill='%23000000' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: '120px'
        }} 
      />

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-location-picker'))}>
          <MapPin className="h-5 w-5 text-black stroke-[2.5]" />
          <div className="flex items-center gap-1">
            <span className="text-black text-lg font-black tracking-tight">{currentAddress}</span>
            <ChevronDown className="h-4 w-4 text-black/60" />
          </div>
        </div>

        <Avatar className="h-11 w-11 border-2 border-white shadow-lg">
          <AvatarImage src={profile?.profileImageUrl || "https://picsum.photos/seed/user/100/100"} />
          <AvatarFallback className="bg-gray-100 text-black font-black text-xs uppercase">{(profile?.fullName || 'U').charAt(0)}</AvatarFallback>
        </Avatar>
      </div>

      {/* Pill Search Bar with Metallic Champagne Gradient */}
      <div className="relative group relative z-10">
        <div className="relative h-14 w-full bg-gradient-to-r from-[#D9C4A9] via-[#F1E4D1] to-[#D9C4A9] rounded-full overflow-hidden shadow-lg border border-[#B8A38B]/30 flex items-center px-5">
          <Search className="h-6 w-6 text-[#5C4D3C] shrink-0" />
          
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search for Food Junction or Groceries"
            className="h-full w-full bg-transparent border-none pl-3 pr-20 text-[#2D2418] font-bold placeholder:text-[#8C7A63] focus-visible:ring-0 text-sm tracking-tight"
          />
          
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-4 text-[#2D2418]">
             <button className="active:scale-90 transition-all">
                <Camera className="h-6 w-6 stroke-[2.5]" />
             </button>
             <button className="active:scale-90 transition-all">
                <Mic className="h-6 w-6 stroke-[2.5]" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
