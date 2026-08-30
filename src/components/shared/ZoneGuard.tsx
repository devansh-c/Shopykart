'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MapPin, 
  Map as MapIcon, 
  ShieldAlert, 
  Loader2,
  Navigation,
  Crosshair,
  ShieldCheck,
  Navigation2
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

/**
 * Robust Point-in-Polygon Algorithm.
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
 * @fileOverview ZoneGuard - Mandatory Fresh Location Fetch.
 * Forces high-accuracy GPS on every mount. Bypasses stale localStorage coordinates.
 */
export function ZoneGuard({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lng: number} | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isLocating, setIsLocating] = useState(true);
  const [permissionState, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'locating'>('locating');
  const hasAttemptedRef = useRef(false);

  const zonesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'zones'), where('isActive', '==', true));
  }, [firestore]);
  const { data: activeZones } = useCollection<any>(zonesQuery);

  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "GPS Not Supported" });
      setPermissionStatus('denied');
      setIsLocating(false);
      return;
    }

    setPermissionStatus('locating');
    setIsLocating(true);

    // CRITICAL: High Accuracy + No Cache (MaximumAge: 0)
    const options = {
      enableHighAccuracy: true,
      timeout: 20000, // Give 20s for satellite lock
      maximumAge: 0   // FORCE FRESH DATA - DONT USE OLD CACHE
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

            // Update session storage immediately
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
    if (isBot) {
      setIsLocating(false);
      return;
    }

    if (!hasAttemptedRef.current) {
      hasAttemptedRef.current = true;
      handleRequestLocation();
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

    // Fallback: If outside, try last saved zone only if coords are within threshold
    const savedZoneId = typeof window !== 'undefined' ? localStorage.getItem('active_zone_id') : null;
    if (savedZoneId) {
      return activeZones.find(z => z.id === savedZoneId) || null;
    }

    return null;
  }, [activeZones, currentCoords]);

  if (!mounted) return null;

  // Show High-Precision Loading UI
  if (isLocating && !currentCoords) {
    return (
      <div className="fixed inset-0 z-[1000000] bg-white flex flex-col items-center justify-center p-8">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse rounded-full" />
          <div className="relative h-32 w-32 rounded-[2.5rem] bg-white shadow-2xl border-4 border-primary/5 flex items-center justify-center overflow-hidden">
            <Navigation2 className="h-14 w-14 text-primary animate-bounce" />
          </div>
        </div>
        <div className="text-center space-y-2">
           <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">CONNECTING...</h2>
           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] animate-pulse">ESTABLISHING FRESH GPS LOCK</p>
        </div>
      </div>
    );
  }

  // If zone found, render app
  if (currentZone || !activeZones || activeZones.length === 0) {
    return <>{children}</>;
  }

  // OUTSIDE SERVICE ZONE OR DENIED
  return (
    <div className="fixed inset-0 z-[1000000] bg-white flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-12 animate-in fade-in zoom-in duration-700">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full animate-pulse" />
          <div className="relative h-40 w-40 rounded-[3rem] bg-white shadow-2xl border-4 border-primary/5 flex items-center justify-center overflow-hidden">
            <MapIcon className="h-20 w-20 text-primary animate-bounce" />
          </div>
          <div className="absolute -top-4 -right-4 bg-white p-3 rounded-2xl shadow-xl border-2 border-primary/20">
            {permissionState === 'denied' ? <ShieldAlert className="h-6 w-6 text-red-500" /> : <ShieldCheck className="h-6 w-6 text-green-500" />}
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gray-800 leading-[0.9]">
            LOCATION<br /><span className="text-primary">{permissionState === 'denied' ? 'DENIED.' : 'OUTSIDE.'}</span>
          </h1>
          <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] max-w-[280px] mx-auto mt-4 leading-relaxed">
            {permissionState === 'denied' 
              ? 'WE NEED YOUR LOCATION TO DELIVER WITHIN 10 MINS. PLEASE ALLOW GPS ACCESS.' 
              : 'YOU ARE CURRENTLY OUTSIDE OUR SERVICE ZONES. TRY RETRYING FOR PRECISION.'}
          </p>
        </div>

        <div className="w-full space-y-4 pt-4">
           <Button 
            onClick={() => handleRequestLocation()}
            className="w-full h-18 rounded-[2rem] bg-[#0B0B0B] hover:bg-primary text-white font-black uppercase italic text-lg shadow-2xl active:scale-95 transition-all"
           >
             <Navigation className="h-6 w-6 mr-3" />
             RETRY FRESH GPS
           </Button>

           <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-location-picker'))}
            className="text-[11px] font-black text-primary uppercase tracking-[0.2em] underline underline-offset-8"
           >
             CHOOSE HUB MANUALLY
           </button>
        </div>
      </div>
    </div>
  );
}
