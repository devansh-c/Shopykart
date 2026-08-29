'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { MapPin, ChevronRight, Store, Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Universal Location and GPS Permission Picker.
 * Automatically requests GPS on mount to trigger OS permission prompt.
 * Strictly using High-Accuracy mode to avoid 9km error.
 */
export default function LocationRequest() {
  const [isOpen, setIsOpen] = useState(false);
  const [displayZones, setDisplayZones] = useState<any[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const zonesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'zones'), where('isActive', '==', true));
  }, [firestore]);
  
  const { data: activeZones } = useCollection<any>(zonesQuery);

  useEffect(() => {
    const isBot = /bot|googlebot|crawler|spider|robot|crawling|lighthouse|headless|xml-sitemaps/i.test(navigator.userAgent);
    if (isBot) return;

    // 1. AUTO TRIGGER GPS PERMISSION PROMPT ON START
    const triggerGPS = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => console.log("GPS Permission Granted"),
          () => console.warn("GPS Permission Denied"),
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      }
    };

    const handleOpen = () => { setIsOpen(true); };
    window.addEventListener('open-location-picker', handleOpen);
    
    const cached = localStorage.getItem('shopykart_zones_cache');
    if (cached) {
      try { setDisplayZones(JSON.parse(cached)); } catch (e) {}
    }

    const timer = setTimeout(triggerGPS, 3000);

    return () => { 
      window.removeEventListener('open-location-picker', handleOpen); 
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (activeZones && activeZones.length > 0) {
      setDisplayZones(activeZones);
      localStorage.setItem('shopykart_zones_cache', JSON.stringify(activeZones));
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
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        localStorage.setItem('user_plus_code', `${lat},${lng}`);
        toast({ title: "Coordinates Detected!", description: "Exact location locked. Select your area below." });
      },
      () => {
        setIsDetecting(false);
        toast({ variant: "destructive", title: "Accuracy Error", description: "Please allow GPS for precise location." });
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  };

  const handleZoneSelect = (zone: any) => {
    setIsOpen(false);
    localStorage.setItem('active_zone_id', zone.id);
    localStorage.setItem('user_city', zone.city || 'Local');
    localStorage.setItem('user_address', zone.name);
    localStorage.setItem('user_location_set', 'true');

    window.dispatchEvent(new CustomEvent('user-address-updated'));
    toast({ title: `Serving ${zone.name}` });

    if (user && firestore) {
      setDoc(doc(firestore, 'users', user.uid), {
        city: zone.city || 'Local',
        lastSelectedZone: zone.name,
        updatedAt: serverTimestamp()
      }, { merge: true }).catch(() => {});
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="rounded-t-[3rem] sm:rounded-[3rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl h-[600px] flex flex-col focus:outline-none bottom-0 top-auto translate-y-0 sm:top-1/2 sm:-translate-y-1/2">
        <DialogHeader className="p-6 bg-white border-b shrink-0">
          <div className="flex flex-col items-center text-center space-y-2">
             <div className="bg-primary/10 p-2.5 rounded-2xl text-primary mb-1"><MapPin className="h-6 w-6" /></div>
             <DialogTitle className="font-black italic uppercase text-2xl tracking-tighter text-gray-900 leading-none">SELECT AREA</DialogTitle>
             <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Unlock 10-Min Delivery in your Zone</DialogDescription>
          </div>
        </DialogHeader>

        <div className="p-5 border-b shrink-0">
           <button onClick={handleDetectLocation} disabled={isDetecting} className="w-full h-14 bg-[#0B0B0B] text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase italic shadow-xl active:scale-95 transition-all">
              <Crosshair className={cn("h-5 w-5 text-primary", isDetecting && "animate-spin")} />
              {isDetecting ? 'DETECTING...' : 'USE CURRENT LOCATION'}
           </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
          <div className="p-5 space-y-3">
            {displayZones.map((zone: any) => (
              <button key={zone.id} onClick={() => handleZoneSelect(zone)} className="w-full bg-white p-5 rounded-[1.75rem] border-2 border-gray-50 shadow-sm flex items-center justify-between group active:scale-[0.96] transition-all">
                <div className="flex items-center gap-4 text-left"><div className="bg-gray-50 p-3 rounded-2xl group-hover:bg-primary/10 group-hover:text-primary"><Store className="h-5 w-5" /></div><div><h4 className="font-black italic uppercase text-sm leading-none mb-1 text-gray-800">{zone.name}</h4><span className="text-[9px] font-bold text-muted-foreground uppercase">{zone.city} • 10 Mins Delivery</span></div></div>
                <ChevronRight className="h-5 w-5 text-gray-200 group-hover:text-primary" />
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
