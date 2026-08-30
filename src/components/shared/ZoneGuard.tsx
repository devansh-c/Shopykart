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
  Check
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';

const GoogleMapPicker = dynamic(() => import('./GoogleMapPicker'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-white flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
});

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
 * @fileOverview ZoneGuard - Zomato Style Confirmation Gate.
 * Forces Fresh GPS -> Shows Draggable Map -> User Confirms -> Enter App.
 */
export function ZoneGuard({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  // States: 'locating' | 'confirming' | 'granted' | 'denied'
  const [guardState, setGuardState] = useState<'locating' | 'confirming' | 'granted' | 'denied'>('locating');
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lng: number} | null>(null);
  const [mounted, setMounted] = useState(false);
  const hasAttemptedRef = useRef(false);

  const zonesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'zones'), where('isActive', '==', true));
  }, [firestore]);
  const { data: activeZones } = useCollection<any>(zonesQuery);

  const handleInitialLocate = () => {
    if (!navigator.geolocation) {
      setGuardState('denied');
      return;
    }

    setGuardState('locating');

    const options = {
      enableHighAccuracy: true,
      timeout: 20000, 
      maximumAge: 0   
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGuardState('confirming'); // Force confirm on map even if GPS is found
      },
      (err) => {
        console.error("GPS Lock Error:", err);
        setGuardState('confirming'); // Show map anyway so they can pick manually
      },
      options
    );
  };

  useEffect(() => {
    setMounted(true);
    const isBot = /bot|googlebot|crawler|spider|robot|crawling|lighthouse|headless|xml-sitemaps/i.test(navigator.userAgent);
    if (isBot) {
      setGuardState('granted');
      return;
    }

    // Always re-fetch fresh location on every app open/refresh as requested
    if (!hasAttemptedRef.current) {
      hasAttemptedRef.current = true;
      handleInitialLocate();
    }
  }, []);

  const handleFinalConfirm = (lat: number, lng: number, address?: string) => {
    // 1. Store the confirmed precise data
    localStorage.setItem('user_plus_code', `${lat},${lng}`);
    localStorage.setItem('user_location_set', 'true');
    if (address) {
      localStorage.setItem('user_address', address.split(',')[0].toUpperCase());
      localStorage.setItem('user_address_line', address.toUpperCase());
    }

    // 2. Sync with Zone Logic
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
      }
    }

    window.dispatchEvent(new CustomEvent('user-address-updated'));
    setGuardState('granted');
    toast({ title: "Location Confirmed! 🚚" });
  };

  if (!mounted) return null;

  // 1. LOCATING SCREEN
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
           <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">CONNECTING...</h2>
           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] animate-pulse">ESTABLISHING FRESH GPS LOCK</p>
        </div>
      </div>
    );
  }

  // 2. CONFIRMATION MAP (The "Zomato" Gate)
  if (guardState === 'confirming') {
    return (
      <div className="fixed inset-0 z-[1000000] bg-white flex flex-col overflow-hidden">
        <div className="bg-white px-6 py-5 border-b flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><MapPin className="h-5 w-5" /></div>
             <div>
                <h2 className="text-sm font-black italic uppercase leading-none">Confirm Spot</h2>
                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-1">Move map to place pin at your door</p>
             </div>
          </div>
          <button onClick={() => window.location.reload()} className="text-[9px] font-black uppercase text-primary border-b border-primary">RETRY GPS</button>
        </div>
        <div className="flex-1 relative">
           <GoogleMapPicker onConfirm={handleFinalConfirm} />
        </div>
      </div>
    );
  }

  // 3. DENIED SCREEN
  if (guardState === 'denied') {
    return (
      <div className="fixed inset-0 z-[1000000] bg-white flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm flex flex-col items-center text-center space-y-12 animate-in fade-in zoom-in duration-700">
          <div className="relative h-40 w-40 rounded-[3rem] bg-white shadow-2xl border-4 border-primary/5 flex items-center justify-center overflow-hidden">
            <ShieldAlert className="h-20 w-20 text-red-500 animate-bounce" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gray-800 leading-[0.9]">PERMISSION<br /><span className="text-primary">DENIED.</span></h1>
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] max-w-[280px] mx-auto mt-4 leading-relaxed">WE NEED YOUR LOCATION TO ENSURE 10-MIN DELIVERY. PLEASE ALLOW GPS ACCESS.</p>
          </div>
          <Button onClick={() => window.location.reload()} className="w-full h-18 rounded-[2rem] bg-black text-white font-black uppercase italic text-lg shadow-2xl active:scale-95 transition-all">TRY AGAIN</Button>
        </div>
      </div>
    );
  }

  // 4. GRANTED - RENDER APP
  return <>{children}</>;
}
