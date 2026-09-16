'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { MapPin, ChevronRight, Store, Loader2, X } from 'lucide-react';

/**
 * @fileOverview Simplified Location Selection - Manual Zone Selection ONLY.
 * GPS and Map Pinning systems have been removed as requested.
 */
export default function LocationRequest() {
  const [isOpen, setIsOpen] = useState(false);
  const [displayZones, setDisplayZones] = useState<any[]>([]);
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
      
      const hasLocationSet = localStorage.getItem('user_location_set') === 'true';
      const isBot = /bot|googlebot|crawler|spider|robot|lighthouse/i.test(navigator.userAgent);
      
      if (hasLocationSet || isBot) return;

      if (!userLoading && !profileLoading) {
        if (profile?.lastSelectedZone && activeZones) {
          const matchedZone = activeZones.find((z: any) => z.name === profile.lastSelectedZone);
          if (matchedZone) {
            handleZoneSelect(matchedZone, true);
            return;
          }
        }
        setIsOpen(true);
      }
    };

    const timer = setTimeout(checkLocationStatus, 1500);

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

    if (user && firestore && !isSilent) {
      setDoc(doc(firestore, 'users', user.uid), {
        city: zone.city || 'Local',
        lastSelectedZone: zone.name,
        updatedAt: serverTimestamp()
      }, { merge: true }).catch(() => {});
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="rounded-t-[3rem] sm:rounded-[3rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl h-[500px] flex flex-col focus:outline-none bottom-0 top-auto translate-y-0 sm:top-1/2 sm:-translate-y-1/2">
        <DialogHeader className="p-8 bg-white border-b shrink-0">
          <div className="flex flex-col items-center text-center space-y-2">
             <div className="bg-primary/10 p-3 rounded-2xl text-primary mb-2 shadow-inner"><MapPin className="h-7 w-7" /></div>
             <DialogTitle className="font-black italic uppercase text-2xl tracking-tighter text-gray-900 leading-none">SELECT YOUR AREA</DialogTitle>
             <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Choose a delivery zone to continue</DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
          <div className="p-5 space-y-3">
            {displayZones.length > 0 ? displayZones.map((zone: any) => (
              <button 
                key={zone.id} 
                onClick={() => handleZoneSelect(zone)} 
                className="w-full bg-white p-6 rounded-[2rem] border-2 border-gray-50 shadow-sm flex items-center justify-between group active:scale-[0.96] transition-all hover:border-primary/20"
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
              <div className="text-center py-20 opacity-20">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t text-center">
           <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em]">ShopyKart Premium Delivery</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
