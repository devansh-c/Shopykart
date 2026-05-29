
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
  Search,
  Crosshair
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * Point-in-Polygon Algorithm (Ray Casting)
 * vs: Array of points (can be [lat, lng] or {lat, lng})
 */
function isPointInPolygon(lat: number, lng: number, vs: any[]) {
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const pI = vs[i];
    const pJ = vs[j];
    
    // Extract coordinates supporting both Array and Object formats
    const xi = Array.isArray(pI) ? pI[0] : pI.lat;
    const yi = Array.isArray(pI) ? pI[1] : pI.lng;
    const xj = Array.isArray(pJ) ? pJ[0] : pJ.lat;
    const yj = Array.isArray(pJ) ? pJ[1] : pJ.lng;

    const intersect = ((yi > lng) !== (yj > lng))
        && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function ZoneGuard({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();
  const { user, loading: userLoading } = useUser();
  const [currentPincode, setCurrentPincode] = useState<string | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lng: number} | null>(null);
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
      const plusCode = localStorage.getItem('user_plus_code');
      
      setCurrentPincode(pin);
      if (plusCode) {
        const [lat, lng] = plusCode.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          setCurrentCoords({ lat, lng });
        }
      }
    };
    updateLocation();
    window.addEventListener('user-address-updated', updateLocation);
    return () => window.removeEventListener('user-address-updated', updateLocation);
  }, []);

  const currentZone = useMemo(() => {
    if (!activeZones) return null;

    // 1. Try Map Boundary Check First (Most Accurate)
    if (currentCoords) {
      const matchedMapZone = activeZones.find(zone => {
        if (zone.boundary && Array.isArray(zone.boundary) && zone.boundary.length > 2) {
          return isPointInPolygon(currentCoords.lat, currentCoords.lng, zone.boundary);
        }
        return false;
      });
      if (matchedMapZone) return matchedMapZone;
    }

    // 2. Fallback to Pincode Check
    if (currentPincode) {
      return activeZones.find(zone => zone.pincodes && zone.pincodes.includes(currentPincode));
    }

    return null;
  }, [activeZones, currentPincode, currentCoords]);

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
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Verifying Delivery Zone...</p>
      </div>
    );
  }

  const hasLocation = !!localStorage.getItem('user_location_set');
  const noZonesDefined = !activeZones || activeZones.length === 0;

  if (noZonesDefined || !hasLocation || !!currentZone) {
    if (currentZone) {
      localStorage.setItem('active_zone_id', currentZone.id);
    } else {
      localStorage.removeItem('active_zone_id');
    }
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[500] bg-[#F9FAFB] flex flex-col items-center justify-center p-8 overflow-y-auto no-scrollbar">
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-10 animate-in fade-in zoom-in duration-700 py-10">
        
        <div className="relative">
          <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full animate-pulse" />
          <div className="relative h-40 w-40 rounded-[3rem] bg-white shadow-2xl border-4 border-primary/5 flex items-center justify-center overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <MapIcon className="h-20 w-20 text-primary animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
          <div className="absolute -top-4 -right-4 bg-white p-3 rounded-2xl shadow-xl border-2 border-red-50">
            <ShieldAlert className="h-6 w-6 text-red-600" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-5 py-1.5 rounded-full border border-red-100">
            <Navigation className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Boundary Error</span>
          </div>
          
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gray-800 leading-[0.9]">
            SERVICE<br /><span className="text-primary">UNAVAILABLE.</span>
          </h1>
          
          <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] leading-relaxed max-w-[280px] mx-auto mt-4">
            Aapki location hamare delivery area se bahar hai. Ham jaldi hi aapke tak pahonchenge!
          </p>
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
                 <p className="text-[8px] font-black uppercase tracking-[0.5em]">ShopyKart Elite Network</p>
                 <div className="h-1 w-1 bg-gray-400 rounded-full" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
