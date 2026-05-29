'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, 
  ChevronRight, 
  Map as MapIcon, 
  Rocket, 
  Timer, 
  ShieldAlert, 
  Loader2,
  Navigation,
  Sparkles,
  Search
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * @fileOverview ZoneGuard validates if the customer is within an active serving zone.
 * Blocks entire app UI for customers if they are in an unserved area.
 * MODIFIED: Bypasses blocking if no zones are defined in the system yet.
 */
export function ZoneGuard({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();
  const { user, loading: userLoading } = useUser();
  const [currentPincode, setCurrentPincode] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Fetch active zones
  const zonesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'zones'), where('isActive', '==', true));
  }, [firestore]);
  const { data: activeZones, loading: zonesLoading } = useCollection<any>(zonesQuery);

  useEffect(() => {
    setMounted(true);
    const updateLocation = () => {
      const pin = localStorage.getItem('user_pincode');
      setCurrentPincode(pin);
    };
    updateLocation();
    window.addEventListener('user-address-updated', updateLocation);
    return () => window.removeEventListener('user-address-updated', updateLocation);
  }, []);

  const currentZone = useMemo(() => {
    if (!activeZones || !currentPincode) return null;
    return activeZones.find(zone => zone.pincodes.includes(currentPincode));
  }, [activeZones, currentPincode]);

  useEffect(() => {
    if (!zonesLoading && !userLoading) {
      const timer = setTimeout(() => setIsChecking(false), 500);
      return () => clearTimeout(timer);
    }
  }, [zonesLoading, userLoading]);

  if (!mounted || isChecking || zonesLoading || userLoading) {
    return (
      <div className="fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-center p-8">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Verifying Serving Zone...</p>
      </div>
    );
  }

  const hasLocation = !!localStorage.getItem('user_location_set');
  
  // NEW LOGIC: If Admin hasn't created any zones yet, don't block anyone.
  // This allows the app to function normally until the first zone is defined.
  const noZonesDefined = !activeZones || activeZones.length === 0;

  if (noZonesDefined || !hasLocation || !!currentZone) {
    if (currentZone) {
      localStorage.setItem('active_zone_id', currentZone.id);
    } else {
      // Clear zone ID if we are in "No Zones Defined" mode or location not set
      localStorage.removeItem('active_zone_id');
    }
    return <>{children}</>;
  }

  // ONLY SHOW BLOCKING SCREEN IF:
  // 1. Zones are defined in Admin Panel
  // 2. Customer has set a location
  // 3. Customer's pincode doesn't match any zone
  return (
    <div className="fixed inset-0 z-[500] bg-[#F9FAFB] flex flex-col items-center justify-center p-8 overflow-y-auto no-scrollbar">
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-10 animate-in fade-in zoom-in duration-700 py-10">
        
        <div className="relative">
          <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full animate-pulse" />
          <div className="relative h-40 w-40 rounded-[3rem] bg-white shadow-2xl border-4 border-primary/5 flex items-center justify-center overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <MapIcon className="h-20 w-20 text-primary animate-bounce" style={{ animationDuration: '3s' }} />
            <div className="absolute bottom-4 flex items-center gap-1.5">
               <div className="h-1.5 w-1.5 bg-red-500 rounded-full animate-pulse" />
               <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Out of Bounds</span>
            </div>
          </div>
          
          <div className="absolute -top-4 -right-4 bg-white p-3 rounded-2xl shadow-xl border-2 border-red-50 animate-in zoom-in delay-300">
            <ShieldAlert className="h-6 w-6 text-red-600" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-5 py-1.5 rounded-full border border-red-100">
            <Navigation className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Pincode: {currentPincode}</span>
          </div>
          
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gray-800 leading-[0.9]">
            SERVICE<br /><span className="text-primary">UNAVAILABLE.</span>
          </h1>
          
          <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] leading-relaxed max-w-[280px] mx-auto mt-4">
            WE ARE SORRY! OUR GOURMET NETWORK DOES NOT SERVE THIS AREA YET.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 w-full pt-4">
           <div className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-4 text-left group active:scale-[0.98] transition-all">
              <div className="bg-blue-50 p-3 rounded-2xl text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                 <Rocket className="h-6 w-6" />
              </div>
              <div>
                 <h4 className="text-xs font-black uppercase text-gray-800">Coming Soon</h4>
                 <p className="text-[9px] font-bold text-muted-foreground uppercase">Expansion in progress</p>
              </div>
              <ChevronRight className="ml-auto h-4 w-4 text-gray-300" />
           </div>

           <div className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-4 text-left group active:scale-[0.98] transition-all">
              <div className="bg-green-50 p-3 rounded-2xl text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors">
                 <Timer className="h-6 w-6" />
              </div>
              <div>
                 <h4 className="text-xs font-black uppercase text-gray-800">Notify Me</h4>
                 <p className="text-[9px] font-bold text-muted-foreground uppercase">Get alert when we launch</p>
              </div>
              <ChevronRight className="ml-auto h-4 w-4 text-gray-300" />
           </div>
        </div>

        <div className="w-full space-y-6 pt-4">
           <Button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-location-picker'))}
            className="w-full h-16 rounded-[2.5rem] bg-[#0B0B0B] hover:bg-primary text-white font-black uppercase italic text-lg shadow-2xl transition-all active:scale-95"
           >
             <Search className="h-5 w-5 mr-3" />
             CHANGE LOCATION
           </Button>

           <div className="flex flex-col items-center gap-4 opacity-30">
              <div className="flex items-center gap-2">
                 <div className="h-1 w-1 bg-gray-400 rounded-full" />
                 <p className="text-[8px] font-black uppercase tracking-[0.5em]">ShopyKart Ecosystem</p>
                 <div className="h-1 w-1 bg-gray-400 rounded-full" />
              </div>
              <p className="text-[7px] font-black uppercase tracking-widest">Serving Jhansi • Ranipur • Mauranipur</p>
           </div>
        </div>
      </div>
    </div>
  );
}
