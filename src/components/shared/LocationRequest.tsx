'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { MapPin, ChevronRight, Store, Map as MapIcon, Loader2, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('./MapPicker'), { 
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-muted animate-pulse rounded-3xl" />
});

/**
 * @fileOverview Optimized LocationRequest.
 * Removed all loading indicators and implemented zero-delay selection.
 */
export function LocationRequest() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'list' | 'map'>('list');
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const zonesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'zones'), where('isActive', '==', true));
  }, [firestore]);
  
  // zonesLoading is still fetched but we no longer block the UI with it
  const { data: activeZones } = useCollection<any>(zonesQuery);

  useEffect(() => {
    const handleOpen = () => {
      setView('list');
      setIsOpen(true);
    };
    window.addEventListener('open-location-picker', handleOpen);
    
    const isLocationSet = localStorage.getItem('user_location_set') === 'true';
    
    if (!isLocationSet) {
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('open-location-picker', handleOpen);
      };
    }

    return () => {
      window.removeEventListener('open-location-picker', handleOpen);
    };
  }, []);

  const handleZoneSelect = (zone: any) => {
    // 1. INSTANT UI CLOSE (NO DELAY)
    setIsOpen(false);

    // 2. Synchronous local updates
    localStorage.setItem('active_zone_id', zone.id);
    localStorage.setItem('user_city', zone.city || 'Local');
    localStorage.setItem('user_address', zone.name);
    localStorage.setItem('user_location_set', 'true');

    // 3. Immediate Feedback
    window.dispatchEvent(new CustomEvent('user-address-updated'));
    toast({ 
      title: `Serving ${zone.name}`, 
      description: `Welcome to ShopyKart ${zone.city}.` 
    });

    // 4. Background Server Sync (Non-blocking)
    if (user && firestore) {
      setDoc(doc(firestore, 'users', user.uid), {
        city: zone.city || 'Local',
        lastSelectedZone: zone.name,
        updatedAt: serverTimestamp()
      }, { merge: true }).catch(() => {});
    }
  };

  const handleMapConfirm = (lat: number, lng: number) => {
    setIsOpen(false);
    localStorage.setItem('user_plus_code', `${lat},${lng}`);
    localStorage.setItem('user_location_set', 'true');
    
    window.dispatchEvent(new CustomEvent('user-address-updated'));
    toast({ title: "Precision Pin Set! 📍" });

    if (user && firestore) {
      setDoc(doc(firestore, 'users', user.uid), {
        latitude: lat,
        longitude: lng,
        updatedAt: serverTimestamp()
      }, { merge: true }).catch(() => {});
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="rounded-t-[3rem] sm:rounded-[3rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl h-[580px] flex flex-col focus:outline-none bottom-0 top-auto translate-y-0 sm:top-1/2 sm:-translate-y-1/2">
        <DialogHeader className="p-8 bg-white border-b shrink-0">
          <div className="flex flex-col items-center text-center space-y-2">
             <div className="bg-primary/10 p-2.5 rounded-2xl text-primary mb-1">
                <MapPin className="h-6 w-6" />
             </div>
             <DialogTitle className="font-black italic uppercase text-2xl tracking-tighter text-gray-900 leading-none">
               SELECT YOUR AREA
             </DialogTitle>
             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
               CHOOSE WHERE YOU WANT DELIVERY
             </p>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
          {view === 'list' ? (
            <div className="p-6 space-y-4">
              {/* NO LOADING SPINNER - Content appears naturally or stays blank until fetched */}
              <div className="space-y-3 min-h-[300px]">
                {activeZones?.map((zone: any) => (
                  <button 
                    key={zone.id}
                    onPointerDown={() => handleZoneSelect(zone)}
                    className="w-full bg-white p-5 rounded-[1.5rem] border-2 border-gray-50 shadow-sm flex items-center justify-between group active:scale-[0.96] transition-all transform-gpu"
                  >
                    <div className="flex items-center gap-4 text-left pointer-events-none">
                       <div className="bg-gray-50 p-3 rounded-2xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <Store className="h-5 w-5" />
                       </div>
                       <div>
                          <h4 className="font-black italic uppercase text-sm leading-none mb-1 text-gray-800">{zone.name}</h4>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{zone.city} • Fast Delivery</span>
                       </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-200 group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>

              <div className="pt-4 sticky bottom-0 bg-white">
                 <button 
                  onPointerDown={() => setView('map')}
                  className="w-full h-16 bg-black text-white rounded-3xl font-black uppercase italic text-[11px] tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all transform-gpu"
                 >
                   <Navigation className="h-4 w-4 text-primary" />
                   USE GOOGLE MAP PIN INSTEAD
                 </button>
              </div>
            </div>
          ) : (
            <div className="h-full relative">
               <MapPicker onConfirm={handleMapConfirm} />
               <button 
                onPointerDown={() => setView('list')}
                className="absolute top-6 left-6 z-[1001] bg-white h-10 px-5 rounded-2xl shadow-2xl border border-border font-black text-[10px] uppercase active:scale-95 transition-all"
               >
                 ← BACK
               </button>
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t shrink-0 text-center opacity-30">
           <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.5em]">ShopyKart Ecosystem</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
