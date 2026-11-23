
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Search, 
  MapPin, 
  Star, 
  Wifi, 
  Car, 
  Coffee, 
  Tv, 
  Wind,
  Loader2,
  Building2,
  Navigation,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Hotelवाले - Main Customer Listing Page (OYO Style).
 */
export default function HotelWalePage() {
  const router = useRouter();
  const firestore = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActiveZoneId(localStorage.getItem('active_zone_id'));
    }
  }, []);

  const hotelsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'hotels'), where('status', '==', 'approved'));
  }, [firestore]);

  const { data: hotels, loading } = useCollection<any>(hotelsQuery);

  const filteredHotels = useMemo(() => {
    if (!hotels) return [];
    return hotels.filter(hotel => {
      const matchesSearch = hotel.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           hotel.address?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesZone = !activeZoneId || hotel.zoneId === activeZoneId || hotel.zoneId === 'global';
      return matchesSearch && matchesZone;
    });
  }, [hotels, searchQuery, activeZoneId]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-32">
      {/* Dynamic Header */}
      <header className="bg-white/80 backdrop-blur-xl py-4 px-6 sticky top-0 z-[100] border-b border-gray-100 space-y-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50 active:scale-90 transition-all">
            <ChevronLeft className="h-5 w-5 text-gray-800" />
          </button>
          <div className="flex-1">
             <h1 className="text-xl font-black uppercase italic tracking-tighter text-gray-900 leading-none">Hotelवाले</h1>
             <p className="text-[8px] font-bold text-primary uppercase mt-1">Verified Premium Stays</p>
          </div>
          <button onClick={() => router.push('/hotel/login')} className="h-9 px-4 bg-black text-white rounded-xl font-black uppercase italic text-[9px] tracking-widest shadow-lg">Partner Login</button>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search city, area or hotel name..." 
            className="pl-12 h-14 bg-white border-none rounded-2xl shadow-sm font-bold text-sm"
          />
        </div>
      </header>

      <main className="p-4 space-y-6">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filteredHotels.length > 0 ? (
          filteredHotels.map((hotel) => (
            <div 
              key={hotel.id}
              onClick={() => router.push(`/hotel/details/?id=${hotel.id}`)}
              className="bg-white rounded-[2.5rem] overflow-hidden border border-border shadow-sm active:scale-[0.98] transition-all group cursor-pointer"
            >
              <div className="relative h-56 w-full">
                 <Image src={hotel.imageUrl || 'https://picsum.photos/seed/hotel/800/600'} alt={hotel.name || 'Hotel image'} fill className="object-cover group-hover:scale-105 transition-transform duration-700" unoptimized />
                 <div className="absolute top-4 left-4">
                    <Badge className="bg-white/95 text-primary border-none font-black text-[8px] px-3 py-1 rounded-full shadow-lg uppercase flex items-center gap-1">
                       <Zap className="h-3 w-3 fill-primary" /> Instant Booking
                    </Badge>
                 </div>
                 <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-white flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-black italic">{hotel.rating || '4.5'}</span>
                 </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                   <div className="min-w-0 pr-4">
                      <h3 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 leading-none mb-2 truncate">{hotel.name}</h3>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase italic truncate">
                         <MapPin className="h-3 w-3 text-primary" /> {hotel.address}
                      </div>
                   </div>
                   <div className="text-right shrink-0">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Starts From</span>
                      <div className="text-2xl font-black italic text-gray-900 leading-none">₹{hotel.pricePerNight}<span className="text-[10px] font-bold text-gray-400 italic not-italic lowercase">/night</span></div>
                   </div>
                </div>

                <div className="flex flex-wrap gap-3 py-2 border-y border-dashed border-gray-100">
                   {hotel.amenities?.slice(0, 4).map((amn: string, idx: number) => (
                     <div key={idx} className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
                        {amn.toLowerCase().includes('wifi') && <Wifi className="h-3 w-3 text-gray-400" />}
                        {amn.toLowerCase().includes('ac') && <Wind className="h-3 w-3 text-gray-400" />}
                        {amn.toLowerCase().includes('parking') && <Car className="h-3 w-3 text-gray-400" />}
                        {amn.toLowerCase().includes('tv') && <Tv className="h-3 w-3 text-gray-400" />}
                        <span className="text-[9px] font-black uppercase text-gray-500 tracking-tighter">{amn}</span>
                     </div>
                   ))}
                </div>

                <div className="pt-2 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="bg-green-50 p-1.5 rounded-lg text-green-600 border border-green-100"><ShieldCheck className="h-4 w-4" /></div>
                      <span className="text-[9px] font-black text-green-700 uppercase tracking-widest">ShopyKart Assured</span>
                   </div>
                   <button className="h-12 px-8 bg-[#0B0B0B] group-hover:bg-primary text-white rounded-2xl font-black uppercase italic text-[11px] shadow-xl transition-all flex items-center gap-2">
                      BOOK NOW <ArrowRight className="h-4 w-4" />
                   </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 opacity-20 flex flex-col items-center">
             <Building2 className="h-16 w-16 mb-4" />
             <p className="font-black italic uppercase text-xs">No hotels found in this zone</p>
          </div>
        )}
      </main>
    </div>
  );
}
