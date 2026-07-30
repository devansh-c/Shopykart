'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { MapPin, ChevronRight, Store } from 'lucide-react';

/**
 * @fileOverview Ultra-Fast Location Picker with Crawler Bypass.
 * Optimized for rapid UX. Hidden automatically for search engines.
 */
export default function LocationRequest() {
  const [isOpen, setIsOpen] = useState(false);
  const [displayZones, setDisplayZones] = useState<any[]>([]);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const zonesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'zones'), where('isActive', '==', true));
  }, [firestore]);
  
  const { data: activeZones } = useCollection<any>(zonesQuery);

  useEffect(() => {
    // CRAWLER BYPASS: Do not show location picker to Googlebot/Search Engines
    const isBot = /bot|googlebot|crawler|spider|robot|crawling|lighthouse|headless|xml-sitemaps/i.test(navigator.userAgent);
    if (isBot) return;

    const handleOpen = () => { setIsOpen(true); };
    window.addEventListener('open-location-picker', handleOpen);
    
    const cached = localStorage.getItem('shopykart_zones_cache');
    if (cached) {
      try { setDisplayZones(JSON.parse(cached)); } catch (e) {}
    }

    return () => { window.removeEventListener('open-location-picker', handleOpen); };
  }, []);

  useEffect(() => {
    if (activeZones && activeZones.length > 0) {
      setDisplayZones(activeZones);
      localStorage.setItem('shopykart_zones_cache', JSON.stringify(activeZones));
    }
  }, [activeZones]);

  const handleZoneSelect = (zone: any) => {
    setIsOpen(false);
    localStorage.setItem('active_zone_id', zone.id);
    localStorage.setItem('user_city', zone.city || 'Local');
    localStorage.setItem('user_address', zone.name);
    localStorage.setItem('user_location_set', 'true');

    window.dispatchEvent(new CustomEvent('user-address-updated'));
    
    toast({ 
      title: `Serving ${zone.name}`, 
      description: `Welcome to ShopyKart ${zone.city}.` 
    });

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
      <DialogContent className="rounded-t-[3rem] sm:rounded-[3rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl h-[550px] flex flex-col focus:outline-none bottom-0 top-auto translate-y-0 sm:top-1/2 sm:-translate-y-1/2">
        <DialogHeader className="p-6 bg-white border-b shrink-0">
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
          <div className="p-5 space-y-3">
            {displayZones.length > 0 ? (
              displayZones.map((zone: any) => (
                <button 
                  key={zone.id}
                  onClick={() => handleZoneSelect(zone)}
                  className="w-full bg-white p-5 rounded-[1.75rem] border-2 border-gray-50 shadow-sm flex items-center justify-between group active:scale-[0.96] transition-all transform-gpu"
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
              ))
            ) : (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-full h-20 bg-gray-50 rounded-[1.75rem] animate-pulse border border-gray-100/50" />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="p-5 bg-white border-t shrink-0 text-center opacity-30">
           <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.5em]">ShopyKart Ecosystem</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
