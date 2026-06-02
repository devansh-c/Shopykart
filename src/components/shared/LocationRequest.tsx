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
  const { data: activeZones, loading: zonesLoading } = useCollection<any>(zonesQuery);

  useEffect(() => {
    const handleOpen = () => {
      setView('list');
      setIsOpen(true);
    };
    window.addEventListener('open-location-picker', handleOpen);
    
    const isSet = localStorage.getItem('user_location_set');
    if (!isSet) {
      // Auto-open after splash screen (2s) + small delay
      const timer = setTimeout(() => setIsOpen(true), 2500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('open-location-picker', handleOpen);
      };
    }

    return () => window.removeEventListener('open-location-picker', handleOpen);
  }, []);

  const handleZoneSelect = async (zone: any) => {
    // Save Selection
    localStorage.setItem('active_zone_id', zone.id);
    localStorage.setItem('user_city', zone.city || 'Local');
    localStorage.setItem('user_address', zone.name);
    localStorage.setItem('user_location_set', 'true');

    if (user && firestore) {
      try {
        await setDoc(doc(firestore, 'users', user.uid), {
          city: zone.city || 'Local',
          lastSelectedZone: zone.name,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.error("Zone sync error:", e);
      }
    }

    window.dispatchEvent(new CustomEvent('user-address-updated'));
    toast({ 
      title: `Serving ${zone.name}`, 
      description: `Exploring best stores in ${zone.city}.` 
    });
    setIsOpen(false);
  };

  const handleMapConfirm = async (lat: number, lng: number) => {
    // Point-in-polygon logic is handled in Cart, here we just set the spot
    // For simplicity, we find the nearest zone or just set coordinates
    localStorage.setItem('user_plus_code', `${lat},${lng}`);
    localStorage.setItem('user_location_set', 'true');
    
    if (user && firestore) {
      await setDoc(doc(firestore, 'users', user.uid), {
        latitude: lat,
        longitude: lng,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    window.dispatchEvent(new CustomEvent('user-address-updated'));
    toast({ title: "Precision Pin Set!" });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="rounded-[2.5rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl h-[550px] flex flex-col focus:outline-none">
        <DialogHeader className="p-6 bg-white border-b shrink-0">
          <div className="flex flex-col items-center text-center space-y-1">
             <div className="bg-primary/10 p-2 rounded-xl text-primary mb-1">
                <MapPin className="h-5 w-5" />
             </div>
             <DialogTitle className="font-black italic uppercase text-lg tracking-tighter">
               {view === 'list' ? 'Select Your Area' : 'Pin Your House'}
             </DialogTitle>
             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
               {view === 'list' ? 'Choose where you want delivery' : 'Zoom in for exact accuracy'}
             </p>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto no-scrollbar bg-gray-50/50">
          {view === 'list' ? (
            <div className="p-4 space-y-3">
              {zonesLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-20">
                   <Loader2 className="h-8 w-8 animate-spin" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Loading Areas...</span>
                </div>
              ) : activeZones && activeZones.length > 0 ? (
                activeZones.map((zone: any) => (
                  <button 
                    key={zone.id}
                    onClick={() => handleZoneSelect(zone)}
                    className="w-full bg-white p-5 rounded-[1.5rem] border border-border/60 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-4 text-left">
                       <div className="bg-muted p-3 rounded-2xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <Store className="h-5 w-5" />
                       </div>
                       <div>
                          <h4 className="font-black italic uppercase text-sm leading-none mb-1">{zone.name}</h4>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{zone.city} • Fast Delivery</span>
                       </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-primary transition-colors" />
                  </button>
                ))
              ) : (
                <div className="text-center py-20 opacity-30">
                   <MapIcon className="h-12 w-12 mx-auto mb-2" />
                   <p className="text-xs font-black uppercase">No active zones found</p>
                </div>
              )}

              <div className="pt-4">
                 <button 
                  onClick={() => setView('map')}
                  className="w-full h-14 bg-black text-white rounded-2xl font-black uppercase italic text-[11px] tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
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
                onClick={() => setView('list')}
                className="absolute top-4 left-4 z-[1001] bg-white px-4 py-2 rounded-xl shadow-xl border border-border font-black text-[9px] uppercase active:scale-95"
               >
                 ← BACK TO LIST
               </button>
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t shrink-0 text-center">
           <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.5em]">ShopyKart Ecosystem</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
