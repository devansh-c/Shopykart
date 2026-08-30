'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, 
  ChevronRight, 
  Map as MapIcon, 
  ShieldAlert, 
  Loader2,
  Navigation,
  Search,
  Crosshair,
  MapPinned,
  ShieldCheck,
  CheckCircle2,
  Navigation2
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lng: number} | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isCrawler, setIsCrawler] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [manualZoneId, setManualZoneId] = useState<string | null>(null);
  const [permissionState, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'locating'>('prompt');

  const zonesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'zones'), where('isActive', '==', true));
  }, [firestore]);
  const { data: activeZones, loading: zonesLoading } = useCollection<any>(zonesQuery);

  useEffect(() => {
    setMounted(true);
    
    const isBot = /bot|googlebot|crawler|spider|robot|crawling|lighthouse|headless|xml-sitemaps/i.test(navigator.userAgent);
    setIsCrawler(isBot);

    const updateLocationData = () => {
      const plusCode = localStorage.getItem('user_plus_code');
      const savedZoneId = localStorage.getItem('active_zone_id');
      
      if (plusCode) {
        const [lat, lng] = plusCode.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          setCurrentCoords({ lat, lng });
          setPermissionStatus('granted');
        }
      }
      
      if (savedZoneId) setManualZoneId(savedZoneId);
    };

    updateLocationData();
    window.addEventListener('user-address-updated', updateLocationData);
    return () => window.removeEventListener('user-address-updated', updateLocationData);
  }, []);

  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "GPS Not Supported" });
      return;
    }

    setPermissionStatus('locating');
    setIsLocating(true);

    // AGGRESSIVE PRECISION SETTINGS
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        
        // Reverse Geocode Logic
        try {
          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
          const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`);
          const data = await response.json();
          
          if (data.results && data.results[0]) {
            const address = data.results[0].formatted_address;
            const subLocality = data.results[0].address_components.find((c: any) => 
              c.types.includes('sublocality_level_1') || 
              c.types.includes('neighborhood') || 
              c.types.includes('locality')
            )?.long_name;

            const shortAddress = subLocality || "Detected Area";

            localStorage.setItem('user_plus_code', `${lat},${lng}`);
            localStorage.setItem('user_address', shortAddress.toUpperCase());
            localStorage.setItem('user_address_line', address.toUpperCase());
            localStorage.setItem('user_location_set', 'true');
            
            setCurrentCoords({ lat, lng });
            setPermissionStatus('granted');
            window.dispatchEvent(new CustomEvent('user-address-updated'));
            toast({ title: "Location Verified! 📍" });
          }
        } catch (e) {
          console.error("Geocoding failed", e);
          // Fallback if geocoding fails but GPS worked
          localStorage.setItem('user_plus_code', `${lat},${lng}`);
          setCurrentCoords({ lat, lng });
          setPermissionStatus('granted');
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        setPermissionStatus('denied');
        console.warn("Location denied:", err.message);
        toast({ variant: "destructive", title: "Detection Failed", description: "Please select your zone manually." });
      },
      { 
        enableHighAccuracy: true, // STRICT HIGH ACCURACY
        timeout: 15000, 
        maximumAge: 0 // NO CACHED LOCATION
      }
    );
  };

  const currentZone = useMemo(() => {
    if (!activeZones || activeZones.length === 0) return null;

    // 1. Priority: Manual Selection
    const savedZoneId = typeof window !== 'undefined' ? localStorage.getItem('active_zone_id') : null;
    if (savedZoneId) {
      const found = activeZones.find(z => z.id === savedZoneId);
      if (found) return found;
    }

    // 2. Fallback: GPS Detection
    if (!currentCoords) return null;

    return activeZones.find(zone => {
      if (zone.boundary && Array.isArray(zone.boundary) && zone.boundary.length > 2) {
        return isPointInPolygon(currentCoords.lat, currentCoords.lng, zone.boundary);
      }
      return false;
    });
  }, [activeZones, currentCoords, manualZoneId]);

  if (!mounted) return null;
  if (isCrawler) return <>{children}</>;

  if (zonesLoading || userLoading) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Syncing Logistics...</p>
      </div>
    );
  }

  const isAlreadySet = manualZoneId || (currentCoords && currentZone);

  // IF everything is set, show the app
  if (isAlreadySet || !activeZones || activeZones.length === 0) {
    if (currentZone && !manualZoneId) localStorage.setItem('active_zone_id', currentZone.id);
    return <>{children}</>;
  }

  // STEP 1: PERMISSION PROMPT / INITIAL ACCESS
  if (permissionState === 'prompt' || permissionState === 'locating') {
    return (
      <div className="fixed inset-0 z-[1000000] bg-white flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm flex flex-col items-center text-center space-y-12 animate-in fade-in zoom-in duration-700">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full animate-pulse" />
            <div className="relative h-40 w-40 rounded-[3rem] bg-white shadow-2xl border-4 border-primary/5 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <Navigation2 className={cn("h-20 w-20 text-primary", permissionState === 'locating' ? "animate-pulse" : "animate-bounce")} />
            </div>
            <div className="absolute -top-4 -right-4 bg-white p-3 rounded-2xl shadow-xl border-2 border-primary/20">
              <ShieldCheck className="h-6 w-6 text-green-500" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gray-800 leading-[0.9]">
              {permissionState === 'locating' ? 'FINDING\n' : 'LOCATION\n'}<span className="text-primary">{permissionState === 'locating' ? 'HUB...' : 'REQUIRED.'}</span>
            </h1>
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] leading-relaxed max-w-[280px] mx-auto mt-4">
              WE NEED YOUR LOCATION TO CONNECT YOU TO THE NEAREST SHOPYKART GOURMET HUB FOR 10-MIN DELIVERY.
            </p>
          </div>

          <div className="w-full space-y-4 pt-4">
             <Button 
              onClick={handleRequestLocation}
              disabled={permissionState === 'locating'}
              className="w-full h-16 rounded-[2rem] bg-[#0B0B0B] hover:bg-primary text-white font-black uppercase italic text-lg shadow-2xl active:scale-95 transition-all"
             >
               {permissionState === 'locating' ? (
                 <Loader2 className="h-6 w-6 animate-spin mr-3" />
               ) : (
                 <Crosshair className="h-5 w-5 mr-3" />
               )}
               {permissionState === 'locating' ? 'DETECTING...' : 'ALLOW LOCATION'}
             </Button>

             <button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-location-picker'))}
              className="w-full h-14 rounded-2xl border-2 border-primary/10 text-primary font-black uppercase italic text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-primary/5 transition-all"
             >
               <MapPinned className="h-4 w-4" />
               CHOOSE MANUALLY
             </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 2: DENIED OR OUT OF ZONE SCREEN
  return (
    <div className="fixed inset-0 z-[1000000] bg-white flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-10 animate-in fade-in zoom-in duration-700">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full animate-pulse" />
          <div className="relative h-40 w-40 rounded-[3rem] bg-white shadow-2xl border-4 border-primary/5 flex items-center justify-center overflow-hidden">
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
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Service Alert</span>
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gray-800 leading-[0.9]">
            SERVICE<br /><span className="text-primary">UNAVAILABLE.</span>
          </h1>
          <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] leading-relaxed max-w-[280px] mx-auto mt-4">
            {permissionState === 'denied' 
              ? 'PERMISSION DENIED. PLEASE ALLOW LOCATION ACCESS OR SELECT YOUR ZONE MANUALLY TO CONTINUE.' 
              : 'AAPKI LOCATION HAMARE DELIVERY AREA SE BAHAR HAI YA GPS GALAT DETECT HUA HAI.'}
          </p>
        </div>

        <div className="w-full space-y-4 pt-4">
           <Button 
            onClick={handleRequestLocation}
            className="w-full h-16 rounded-[2rem] bg-[#0B0B0B] hover:bg-primary text-white font-black uppercase italic text-lg shadow-2xl active:scale-95 transition-all"
           >
             <Crosshair className="h-5 w-5 mr-3" />
             RETRY DETECTION
           </Button>

           <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-location-picker'))}
            className="w-full h-14 rounded-2xl border-2 border-primary/10 text-primary font-black uppercase italic text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-primary/5 transition-all"
           >
             <MapPinned className="h-4 w-4" />
             CHOOSE AREA MANUALLY
           </button>
        </div>
        
        <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.4em]">
           ShopyKart Enterprise Network
        </p>
      </div>
    </div>
  );
}
