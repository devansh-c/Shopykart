'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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

/**
 * @fileOverview ZoneGuard with Forced Fresh Location and 20s Accuracy Lock.
 */
export function ZoneGuard({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lng: number} | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isCrawler, setIsCrawler] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [permissionState, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'locating'>('prompt');
  const hasAttemptedRef = useRef(false);

  const zonesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'zones'), where('isActive', '==', true));
  }, [firestore]);
  const { data: activeZones } = useCollection<any>(zonesQuery);

  const handleRequestLocation = (isAuto = false) => {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "GPS Not Supported" });
      setPermissionStatus('denied');
      return;
    }

    setPermissionStatus('locating');
    setIsLocating(true);

    // EXTREME ACCURACY SETTINGS: Strictly fresh satellite lock
    const options = {
      enableHighAccuracy: true,
      timeout: 20000, // 20 Seconds to ensure high precision
      maximumAge: 0   // Fresh fetch only
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        
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

            localStorage.setItem('user_plus_code', `${lat},${lng}`);
            localStorage.setItem('user_address', (subLocality || "Detected Area").toUpperCase());
            localStorage.setItem('user_address_line', address.toUpperCase());
            localStorage.setItem('user_location_set', 'true');
            
            setCurrentCoords({ lat, lng });
            setPermissionStatus('granted');
            window.dispatchEvent(new CustomEvent('user-address-updated'));
          } else {
            setCurrentCoords({ lat, lng });
            setPermissionStatus('granted');
          }
        } catch (e) {
          localStorage.setItem('user_plus_code', `${lat},${lng}`);
          setCurrentCoords({ lat, lng });
          setPermissionStatus('granted');
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.error("GPS Lock Error:", err);
        setIsLocating(false);
        setPermissionStatus('denied');
      },
      options
    );
  };

  useEffect(() => {
    setMounted(true);
    const isBot = /bot|googlebot|crawler|spider|robot|crawling|lighthouse|headless|xml-sitemaps/i.test(navigator.userAgent);
    setIsCrawler(isBot);

    if (!isBot && !hasAttemptedRef.current) {
      hasAttemptedRef.current = true;
      // MANDATORY FRESH FETCH ON EVERY LOAD
      handleRequestLocation(true);
    }
  }, []);

  const currentZone = useMemo(() => {
    if (!activeZones || activeZones.length === 0 || !currentCoords) return null;

    const zoneMatch = activeZones.find(zone => {
      if (zone.boundary && Array.isArray(zone.boundary) && zone.boundary.length > 2) {
        return isPointInPolygon(currentCoords.lat, currentCoords.lng, zone.boundary);
      }
      return false;
    });

    if (zoneMatch) {
      localStorage.setItem('active_zone_id', zoneMatch.id);
      return zoneMatch;
    }

    const savedZoneId = typeof window !== 'undefined' ? localStorage.getItem('active_zone_id') : null;
    if (savedZoneId) {
      return activeZones.find(z => z.id === savedZoneId) || null;
    }

    return null;
  }, [activeZones, currentCoords]);

  if (!mounted) return null;
  if (isCrawler) return <>{children}</>;

  if (permissionState === 'locating' || (isLocating && !currentCoords)) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center gap-6 p-8">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse rounded-full" />
          <div className="relative h-32 w-32 rounded-[2.5rem] bg-white shadow-2xl border-4 border-primary/5 flex items-center justify-center overflow-hidden">
            <Navigation2 className="h-14 w-14 text-primary animate-bounce" />
          </div>
        </div>
        <div className="text-center space-y-2">
           <h2 className="text-xl font-black italic uppercase tracking-tighter">Locating Your Spot...</h2>
           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest animate-pulse">Establishing Ultra-Accurate GPS Lock</p>
        </div>
      </div>
    );
  }

  const isZoneLocked = !!currentZone;

  if (isZoneLocked || !activeZones || activeZones.length === 0) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[1000000] bg-white flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-12 animate-in fade-in zoom-in duration-700">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full animate-pulse" />
          <div className="relative h-40 w-40 rounded-[3rem] bg-white shadow-2xl border-4 border-primary/5 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <MapIcon className="h-20 w-20 text-primary animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
          <div className="absolute -top-4 -right-4 bg-white p-3 rounded-2xl shadow-xl border-2 border-primary/20">
            {permissionState === 'denied' ? <ShieldAlert className="h-6 w-6 text-red-500" /> : <ShieldCheck className="h-6 w-6 text-green-500" />}
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gray-800 leading-[0.9]">
            LOCATION<br /><span className="text-primary">{permissionState === 'denied' ? 'DENIED.' : 'OUTSIDE.'}</span>
          </h1>
          <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] max-w-[280px] mx-auto mt-4">
            {permissionState === 'denied' 
              ? 'PLEASE ALLOW GPS ACCESS TO CONNECT TO THE NEAREST HUB.' 
              : 'YOU ARE CURRENTLY OUTSIDE OUR SERVICE ZONES. PLEASE CHOOSE A HUB MANUALLY.'}
          </p>
        </div>

        <div className="w-full space-y-4 pt-4">
           <Button 
            onClick={() => handleRequestLocation()}
            disabled={isLocating}
            className="w-full h-16 rounded-[2rem] bg-[#0B0B0B] hover:bg-primary text-white font-black uppercase italic text-lg shadow-2xl active:scale-95 transition-all"
           >
             {isLocating ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <Crosshair className="h-5 w-5 mr-3" />}
             {isLocating ? 'LOCKING GPS...' : 'RETRY ACCURATE FETCH'}
           </Button>

           <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-location-picker'))}
            className="w-full h-14 rounded-2xl border-2 border-primary/10 text-primary font-black uppercase italic text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-primary/5 transition-all"
           >
             <MapPinned className="h-4 w-4" />
             SELECT HUB MANUALLY
           </button>
        </div>
      </div>
    </div>
  );
}
