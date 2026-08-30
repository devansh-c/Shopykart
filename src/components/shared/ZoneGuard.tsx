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
  Navigation2,
  Check,
  Zap
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';
import { useJsApiLoader } from '@react-google-maps/api';

const GoogleMapPicker = dynamic(() => import('./GoogleMapPicker'), { 
  ssr: false,
  loading: () => <div className="fixed inset-0 z-[1000000] bg-white flex flex-col items-center justify-center p-8">
    <div className="relative mb-10">
      <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse rounded-full" />
      <div className="relative h-24 w-24 rounded-[2rem] bg-white shadow-2xl border-4 border-primary/5 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    </div>
    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] animate-pulse text-center">SYNCHRONIZING HIGH-PRECISION MAPS...</p>
  </div>
});

const libraries: ("places")[] = ["places"];

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
 * @fileOverview ZoneGuard - Entry Gate with 10-Second Smart Logic.
 * If location is accurately fetched within 10s, it auto-opens. 
 * Otherwise, forces manual pin on map.
 */
export function ZoneGuard({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [guardState, setGuardState] = useState<'locating' | 'confirming' | 'granted' | 'denied'>('locating');
  const [initialCoords, setInitialCoords] = useState<{lat: number, lng: number} | null>(null);
  const [mounted, setMounted] = useState(false);
  const hasAttemptedRef = useRef(false);

  // Global Loader to ensure 'google' object is ready for Geocoding
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries
  });

  const zonesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'zones'), where('isActive', '==', true));
  }, [firestore]);
  const { data: activeZones } = useCollection<any>(zonesQuery);

  const handleFinalConfirm = async (lat: number, lng: number, address?: string) => {
    localStorage.setItem('user_plus_code', `${lat},${lng}`);
    localStorage.setItem('user_location_set', 'true');
    if (address) {
      localStorage.setItem('user_address', address.split(',')[0].toUpperCase());
      localStorage.setItem('user_address_line', address.toUpperCase());
    }

    // Try to match zone from fresh data or cache
    if (activeZones && activeZones.length > 0) {
      const zoneMatch = activeZones.find((z: any) => {
        if (z.boundary && Array.isArray(z.boundary) && z.boundary.length > 2) {
          return isPointInPolygon(lat, lng, z.boundary);
        }
        return false;
      });

      if (zoneMatch) {
        localStorage.setItem('active_zone_id', zoneMatch.id);
        localStorage.setItem('user_city', zoneMatch.city || 'Local');
      } else {
        localStorage.removeItem('active_zone_id');
      }
    }

    window.dispatchEvent(new CustomEvent('user-address-updated'));
    setGuardState('granted');
  };

  const handleInitialLocate = () => {
    if (!navigator.geolocation) {
      setGuardState('confirming'); // Force map if no GPS support
      return;
    }

    setGuardState('locating');

    const options = {
      enableHighAccuracy: true,
      timeout: 10000, // STRICT 10 SECOND LIMIT
      maximumAge: 0   // FORCE FRESH DATA
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setInitialCoords(coords);
        
        // AUTO-OPEN LOGIC: Attempt to resolve address and open app instantly
        // DEFENSIVE CHECK: Ensure 'google' exists before creating Geocoder to prevent ReferenceError
        if (typeof google !== 'undefined' && google.maps && google.maps.Geocoder) {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: coords }, (results, status) => {
            if (status === "OK" && results?.[0]) {
              handleFinalConfirm(coords.lat, coords.lng, results[0].formatted_address);
              toast({ title: "Smart GPS Active! 🚚" });
            } else {
              // Fallback to map if geocoding fails
              setGuardState('confirming');
            }
          });
        } else {
          // If GPS is fast but Google script is slow, fallback to map (it handles its own loader)
          setGuardState('confirming');
        }
      },
      (err) => {
        // FAIL OR TIMEOUT: Show manual map picker
        console.warn("GPS 10s Window Expired or Denied. Fallback to Map.");
        setGuardState('confirming');
      },
      options
    );
  };

  useEffect(() => {
    setMounted(true);
    // Crawler/Bot check - bypass for SEO
    const isBot = /bot|googlebot|crawler|spider|robot|crawling|lighthouse|headless|xml-sitemaps/i.test(navigator.userAgent);
    if (isBot) {
      setGuardState('granted');
      return;
    }

    if (!hasAttemptedRef.current) {
      hasAttemptedRef.current = true;
      handleInitialLocate();
    }
  }, []);

  if (!mounted) return null;

  if (guardState === 'locating') {
    return (
      <div className="fixed inset-0 z-[1000000] bg-white flex flex-col items-center justify-center p-8">
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse rounded-full" />
          <div className="relative h-32 w-32 rounded-[2.5rem] bg-white shadow-2xl border-4 border-primary/5 flex items-center justify-center overflow-hidden">
            <Navigation2 className="h-14 w-14 text-primary animate-bounce" />
          </div>
        </div>
        <div className="text-center space-y-2">
           <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">AUTO-FETCHING...</h2>
           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] animate-pulse">10S SMART GPS WINDOW ACTIVE</p>
        </div>
      </div>
    );
  }

  if (guardState === 'confirming') {
    return (
      <div className="fixed inset-0 z-[1000000] bg-white flex flex-col overflow-hidden">
        <div className="bg-white px-6 py-5 border-b flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><MapPin className="h-5 w-5" /></div>
             <div>
                <h2 className="text-sm font-black italic uppercase leading-none">GPS TIMEOUT</h2>
                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-1">Please pin your building manually</p>
             </div>
          </div>
          <button onClick={() => window.location.reload()} className="text-[9px] font-black uppercase text-primary border-b border-primary">RETRY AUTO</button>
        </div>
        <div className="flex-1 relative">
           <GoogleMapPicker 
              onConfirm={handleFinalConfirm} 
              forcedInitialCenter={initialCoords || undefined}
           />
        </div>
      </div>
    );
  }

  if (guardState === 'denied') {
    return (
      <div className="fixed inset-0 z-[1000000] bg-white flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm flex flex-col items-center text-center space-y-12 animate-in fade-in zoom-in duration-700">
          <div className="relative h-40 w-40 rounded-[3rem] bg-white shadow-2xl border-4 border-primary/5 flex items-center justify-center overflow-hidden">
            <ShieldAlert className="h-20 w-20 text-red-500 animate-bounce" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gray-800 leading-[0.9]">ACCESS<br /><span className="text-primary">DENIED.</span></h1>
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] max-w-[280px] mx-auto mt-4 leading-relaxed">LOCATION SERVICES ARE MANDATORY TO ENSURE 10-MIN GOURMET DELIVERY.</p>
          </div>
          <Button onClick={() => window.location.reload()} className="w-full h-18 rounded-[2rem] bg-black text-white font-black uppercase italic text-lg shadow-2xl active:scale-95 transition-all">TRY AGAIN</Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
