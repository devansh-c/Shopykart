'use client';

import {
  Search,
  Camera,
  Mic,
  MapPin,
  ChevronDown,
  Crown
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRef, useState, useEffect } from 'react';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * @fileOverview Slim Header - Matching design with h-12 search bar.
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
    <div className="w-full bg-[#0B0B0B] pb-6 pt-4 px-4 space-y-5 rounded-b-[3rem] shadow-2xl relative z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-location-picker'))}>
          <div className="h-10 w-10 bg-white/5 rounded-full flex items-center justify-center text-primary border border-white/10">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-white text-sm font-black italic uppercase tracking-tight">{currentAddress}</span>
              <ChevronDown className="h-3 w-3 text-white/40" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 shadow-lg">
            <Crown className="h-5 w-5 text-amber-400 fill-amber-400" />
          </div>
          <Avatar className="h-10 w-10 border-2 border-white/10 shadow-xl">
            <AvatarImage src={profile?.profileImageUrl} />
            <AvatarFallback className="bg-white/5 text-white font-black text-xs">{(profile?.fullName || 'U').charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
        <div className="relative h-12 w-full bg-white border border-gray-100 rounded-full overflow-hidden shadow-2xl shadow-black/20">
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Pizza, Burger..."
            className="h-full w-full bg-transparent border-none pl-11 pr-24 text-black font-bold placeholder:text-gray-300 focus-visible:ring-0 text-sm"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
             <button className="p-2 text-gray-400 active:scale-90 transition-all">
                <Camera className="h-4 w-4" />
             </button>
             <div className="h-4 w-[1px] bg-gray-200 mx-1" />
             <button className="p-2 text-gray-400 active:scale-90 transition-all">
                <Mic className="h-4 w-4" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}