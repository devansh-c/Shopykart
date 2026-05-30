
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
 * Standard Robust Point-in-Polygon Algorithm
 * X = Longitude, Y = Latitude
 */
function isPointInPolygon(lat: number, lng: number, points: any[]) {
  if (!points || !Array.isArray(points) || points.length < 3) return false;
  
  const x = Number(lng);
  const y = Number(lat);
  
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = Number(points[i].lng || (Array.isArray(points[i]) ? points[i][1] : points[i].longitude || 0));
    const yi = Number(points[i].lat || (Array.isArray(points[i]) ? points[i][0] : points[i].latitude || 0));
    const xj = Number(points[j].lng || (Array.isArray(points[j]) ? points[j][1] : points[j].longitude || 0));
    const yj = Number(points[j].lat || (Array.isArray(points[j]) ? points[j][0] : points[j].latitude || 0));
    
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function ZoneGuard({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();
  const { user, loading: userLoading } = useUser();
  const [currentPincode, setCurrentPincode] = useState<string | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lng: number} | null>(null);
  const [mounted, setMounted] = useState(false);

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
    if (!activeZones || activeZones.length === 0) return null;

    if (currentCoords) {
      const matchedMapZone = activeZones.find(zone => {
        if (zone.boundary && Array.isArray(zone.boundary) && zone.boundary.length > 2) {
          return isPointInPolygon(currentCoords.lat, currentCoords.lng, zone.boundary);
        }
        return false;
      });
      if (matchedMapZone) return matchedMapZone;
    }

    if (currentPincode) {
      const cleanPin = currentPincode.trim();
      const matchedPinZone = activeZones.find(zone => 
        zone.pincodes && Array.isArray(zone.pincodes) && zone.pincodes.includes(cleanPin)
      );
      if (matchedPinZone) return matchedPinZone;
    }

    return null;
  }, [activeZones, currentPincode, currentCoords]);

  if (!mounted) return null;
  if (zonesLoading || userLoading) return <>{children}</>;

  const hasLocation = !!localStorage.getItem('user_location_set');
  const noZonesDefined = !activeZones || activeZones.length === 0;

  if (noZonesDefined || !hasLocation || !!currentZone) {
    if (currentZone) localStorage.setItem('active_zone_id', currentZone.id);
    else localStorage.removeItem('active_zone_id');
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
        </div>
      </div>
    </div>
  );
}
