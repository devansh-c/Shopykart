'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { MapPin, ChevronRight, Store, Crosshair, Loader2, Navigation, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

const GoogleMapPicker = dynamic(() => import('./GoogleMapPicker'), { 
  ssr: false,
  loading: () => <div className="h-64 w-full bg-muted animate-pulse flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
});

/**
 * @fileOverview Manual Zone Selection with Map-Based Pinning.
 * SMART RECOVERY: Automatically recovers location from logged-in user's profile.
 */
export default function LocationRequest() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [displayZones, setDisplayZones] = useState<any[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, loading: userLoading } = useUser();

  // 1. Fetch active zones
  const zonesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'zones'), where('isActive', '==', true));
  }, [firestore]);
  const { data: activeZones } = useCollection<any>(zonesQuery);

  // 2. Fetch logged-in user's profile for recovery
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: profile, loading: profileLoading } = useDoc<any>(userProfileRef);

  useEffect(() => {
    const checkLocationStatus = () => {
      if (typeof window === 'undefined') return;
      
      const hasZoneId = !!localStorage.getItem('active_zone_id');
      const isBot = /bot|googlebot|crawler|spider|robot|lighthouse/i.test(navigator.userAgent);
      
      // If we already have location in local storage, don't show popup
      if (hasZoneId || isBot) return;

      // SMART RECOVERY: If user is logged in, wait for profile to see if we can restore location
      if (!userLoading && !profileLoading) {
        if (profile?.lastSelectedZone && activeZones) {
          const matchedZone = activeZones.find((z: any) => z.name === profile.lastSelectedZone);
          if (matchedZone) {
            handleZoneSelect(matchedZone, true); // Silent restoration
            return;
          }
        }
        
        // No cached location and no profile recovery possible? Show popup.
        // We only show it if the session is definitely active OR auth finished and no user.
        setIsOpen(true);
      }
    };

    const timer = setTimeout(checkLocationStatus, 2000); // Wait for auth to fully hydrate

    const handleOpenManual = () => { setIsOpen(true); };
    window.addEventListener('open-location-picker', handleOpenManual);
    
    return () => { 
      clearTimeout(timer);
      window.removeEventListener('open-location-picker', handleOpenManual); 
    };
  }, [userLoading, profileLoading, profile, activeZones]);

  useEffect(() => {
    if (activeZones && activeZones.length > 0) {
      setDisplayZones(activeZones);
    }
  }, [activeZones]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "Error", description: "GPS not supported." });
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetecting(false);
        const { latitude, longitude } = pos.coords;
        localStorage.setItem('user_lat', latitude.toString());
        localStorage.setItem('user_lng', longitude.toString());
        toast({ title: "Signal Found!", description: "GPS coordinates locked." });
        setIsMapOpen(true);
      },
      () => {
        setIsDetecting(false);
        toast({ variant: "destructive", title: "GPS Failed", description: "Please pick your area manually." });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleZoneSelect = (zone: any, isSilent = false) => {
    setIsOpen(false);
    localStorage.setItem('active_zone_id', zone.id);
    localStorage.setItem('user_city', zone.city || 'Local');
    localStorage.setItem('user_address', zone.name);
    localStorage.setItem('user_location_set', 'true');

    window.dispatchEvent(new CustomEvent('user-address-updated'));
    
    if (!isSilent) {
      toast({ title: `Zone Set: ${zone.name}` });
    }

    // Save to profile for future cross-device recovery
    if (user && firestore && !isSilent) {
      setDoc(doc(firestore, 'users', user.uid), {
        city: zone.city || 'Local',
        lastSelectedZone: zone.name,
        updatedAt: serverTimestamp()
      }, { merge: true }).catch(() => {});
    }
  };

  const handleConfirmMapLocation = (lat: number, lng: number, address?: string) => {
    localStorage.setItem('user_lat', lat.toString());
    localStorage.setItem('user_lng', lng.toString());
    if (address) localStorage.setItem('user_address_line', address);
    
    setIsMapOpen(false);
    setIsOpen(false);
    localStorage.setItem('user_location_set', 'true');
    window.dispatchEvent(new CustomEvent('user-address-updated'));
    toast({ title: "Drop Spot Pinned! 🏠" });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="rounded-t-[2.5rem] sm:rounded-[2.5rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl h-[550px] flex flex-col focus:outline-none bottom-0 top-auto translate-y-0 sm:top-1/2 sm:-translate-y-1/2">
          <DialogHeader className="p-8 bg-white border-b shrink-0">
            <div className="flex flex-col items-center text-center space-y-2">
               <div className="bg-primary/10 p-3 rounded-2xl text-primary mb-2 shadow-inner"><MapPin className="h-7 w-7" /></div>
               <DialogTitle className="font-black italic uppercase text-2xl tracking-tighter text-gray-900 leading-none">SELECT LOCATION</DialogTitle>
               <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pin your house for accurate delivery</DialogDescription>
            </div>
          </DialogHeader>

          <div className="p-5 border-b shrink-0 bg-gray-50/50 space-y-3">
             <button onClick={() => setIsMapOpen(true)} className="w-full h-14 bg-primary text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase italic shadow-xl active:scale-95 transition-all">
                <Navigation className="h-5 w-5" />
                PIN EXACT HOUSE ON MAP
             </button>
             <button onClick={handleDetectLocation} disabled={isDetecting} className="w-full h-12 bg-black/5 text-black rounded-xl flex items-center justify-center gap-3 font-bold uppercase text-[10px] tracking-widest transition-all">
                <Crosshair className={cn("h-4 w-4 text-primary", isDetecting && "animate-spin")} />
                {isDetecting ? 'DETECTING...' : 'USE SATELLITE GPS'}
             </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
            <div className="p-5 space-y-3">
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-2">Quick Area Select</span>
              {displayZones.length > 0 ? displayZones.map((zone: any) => (
                <button 
                  key={zone.id} 
                  onClick={() => handleZoneSelect(zone)} 
                  className="w-full bg-white p-5 rounded-[1.75rem] border-2 border-gray-50 shadow-sm flex items-center justify-between group active:scale-[0.96] transition-all hover:border-primary/20"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="bg-gray-50 p-3 rounded-2xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Store className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-black italic uppercase text-sm leading-none mb-1 text-gray-800">{zone.name}</h4>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">{zone.city} • 10 Mins Delivery</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-200 group-hover:text-primary transition-all" />
                </button>
              )) : (
                <div className="text-center py-10 opacity-20">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
         <DialogContent className="rounded-none sm:rounded-[3rem] max-w-2xl h-full sm:h-[85vh] p-0 overflow-hidden border-none shadow-2xl focus:outline-none flex flex-col">
            <DialogHeader className="sr-only">
               <DialogTitle>Pin Your Delivery Spot</DialogTitle>
               <DialogDescription>Mark your exact house for precise 10-minute delivery.</DialogDescription>
            </DialogHeader>
            <div className="absolute top-4 right-4 z-[10000]">
               <button onClick={() => setIsMapOpen(false)} className="h-10 w-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-400"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 min-h-0 relative">
               <GoogleMapPicker onConfirm={handleConfirmMapLocation} />
            </div>
         </DialogContent>
      </Dialog>
    </>
  );
}
