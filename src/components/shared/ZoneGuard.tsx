'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MapPin, 
  Loader2,
  Navigation2,
  ShieldAlert
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, serverTimestamp } from 'firebase/firestore';
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
 * Robust Point-in-Polygon Algorithm for zone matching.
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
 * @fileOverview ZoneGuard - Gate with Strict 10-Second Locating Window.
 * Optimized to prevent "google is not defined" error and ensure mandatory manual pin if auto-fetch fails.
 */
export function ZoneGuard({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [guardState, setGuardState] = useState<'locating' | 'confirming' | 'granted' | 'denied'>('locating');
  const [initialCoords, setInitialCoords] = useState<{lat: number, lng: number} | null>(null);
  const [mounted, setMounted] = useState(false);
  const hasAttemptedRef = useRef(false);

  // Load Google Maps script globally for Geocoding support
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
      setGuardState('confirming');
      return;
    }

    // MANDATORY 10-SECOND TIMER: Wait full 10s before showing map if GPS is struggling
    const fallbackTimer = setTimeout(() => {
      setGuardState(current => {
        if (current === 'locating') return 'confirming';
        return current;
      });
    }, 10000);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000, 
      maximumAge: 0   
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setInitialCoords(coords);
        
        // CRITICAL: Check if Google Maps is loaded before using Geocoder
        if (isLoaded && typeof google !== 'undefined' && google.maps && google.maps.Geocoder) {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: coords }, (results, status) => {
            if (status === "OK" && results?.[0]) {
              clearTimeout(fallbackTimer);
              handleFinalConfirm(coords.lat, coords.lng, results[0].formatted_address);
              toast({ title: "Live Accuracy Established! 🚀" });
            }
          });
        }
      },
      (err) => {
        console.warn("GPS Initial Fetch Error:", err.message);
        // Fallback timer will trigger the map screen automatically at 10s
      },
      options
    );

    return () => clearTimeout(fallbackTimer);
  };

  useEffect(() => {
    setMounted(true);
    const isBot = /bot|googlebot|crawler|spider|robot|crawling|lighthouse|headless|xml-sitemaps/i.test(navigator.userAgent);
    if (isBot) {
      setGuardState('granted');
      return;
    }

    // Only start locating if we haven't already and the app is ready
    if (!hasAttemptedRef.current) {
      hasAttemptedRef.current = true;
      handleInitialLocate();
    }
  }, [isLoaded]); // Re-run if loader state changes

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
           <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">Establishing Lock...</h2>
           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] animate-pulse">Waiting for High-Accuracy GPS (10s)</p>
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
                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-1">Manual Pinning Required</p>
             </div>
          </div>
          <button onClick={() => window.location.reload()} className="text-[9px] font-black uppercase text-primary border-b border-primary">Retry Auto</button>
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

  return <>{children}</>;
}
