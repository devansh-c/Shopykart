
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MapPin, 
  Search, 
  Loader2, 
  Map as MapIcon, 
  Navigation,
  Sparkles,
  Building2,
  ChevronRight,
  Globe,
  Crosshair,
  Check,
  AlertTriangle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogOverlay } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('./MapPicker'), { 
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full bg-muted flex items-center justify-center rounded-3xl animate-pulse">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/30" />
    </div>
  )
});

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

export function LocationRequest() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null);

  const zonesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'zones'), where('isActive', '==', true));
  }, [firestore]);

  const { data: zones, loading: zonesLoading } = useCollection<any>(zonesQuery);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = setTimeout(() => setOpen(true), 100);
    const handleOpen = () => {
      setSearchQuery('');
      setView('list');
      setOpen(true);
    };
    window.addEventListener('open-location-picker', handleOpen);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('open-location-picker', handleOpen);
    };
  }, []);

  const filteredZones = useMemo(() => {
    if (!zones) return [];
    if (!searchQuery.trim()) return zones;
    const q = searchQuery.toLowerCase();
    return zones.filter(zone => 
      zone.name?.toLowerCase().includes(q) || 
      zone.city?.toLowerCase().includes(q) ||
      (zone.pincodes && Array.isArray(zone.pincodes) && zone.pincodes.some((p: string) => p.includes(q)))
    );
  }, [zones, searchQuery]);

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "GPS Not Supported", description: "Your browser does not support geolocation." });
      return;
    }

    setIsProcessing(true);
    
    const gpsOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setSelectedCoords([latitude, longitude]);
        
        // Match Zone
        let matchedZone = zones?.find(zone => isPointInPolygon(latitude, longitude, zone.boundary || []));
        
        // Pincode Fallback check if GPS was just outside line
        if (!matchedZone && zones) {
           const savedPin = localStorage.getItem('user_pincode');
           if (savedPin) {
             matchedZone = zones.find(z => z.pincodes && Array.isArray(z.pincodes) && z.pincodes.includes(savedPin.trim()));
           }
        }

        if (matchedZone) {
          handleSelectZone(matchedZone, [latitude, longitude]);
        } else {
          setIsProcessing(false);
          toast({ 
            variant: "destructive", 
            title: "Outside Service Area", 
            description: "GPS detects you are outside our delivery zones. Please pick a location manually." 
          });
        }
      },
      (error) => {
        setIsProcessing(false);
        toast({ variant: "destructive", title: "Location Error", description: "Could not fetch GPS lock." });
      },
      gpsOptions
    );
  };

  const handleSelectZone = async (zone: any, customCoords?: [number, number]) => {
    setIsProcessing(true);
    const lat = customCoords ? customCoords[0] : (zone.boundary?.[0]?.lat || 25.2443);
    const lng = customCoords ? customCoords[1] : (zone.boundary?.[0]?.lng || 79.0838);

    if (typeof window !== 'undefined') {
      localStorage.setItem('user_address_line', zone.name);
      localStorage.setItem('user_city', zone.city || 'Local');
      localStorage.setItem('user_location_set', 'true');
      localStorage.setItem('user_plus_code', `${lat},${lng}`);
      localStorage.setItem('active_zone_id', zone.id);
      
      if (zone.pincodes && Array.isArray(zone.pincodes) && zone.pincodes.length > 0) {
        localStorage.setItem('user_pincode', zone.pincodes[0]);
      }
      
      window.dispatchEvent(new CustomEvent('user-address-updated'));
    }

    if (user && firestore) {
      await updateDoc(doc(firestore, 'users', user.uid), {
        address: zone.name,
        city: zone.city || 'Local',
        latitude: lat,
        longitude: lng,
        updatedAt: serverTimestamp(),
      }).catch(() => {});
    }

    setIsProcessing(false);
    setOpen(false);
    toast({ title: `Location set to ${zone.name}` });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogOverlay className="z-[2000] bg-black/60 backdrop-blur-sm" />
      <DialogContent className="rounded-t-[2.5rem] sm:rounded-[2.5rem] max-w-full sm:max-w-md border-none shadow-2xl overflow-hidden bg-white p-0 focus:outline-none flex flex-col sm:bottom-auto bottom-0 top-auto translate-y-0 sm:translate-y-[-50%] transition-all duration-300 z-[2001]">
        <div className="px-8 py-8">
          <div className="flex flex-col space-y-6">
            <DialogHeader className="flex flex-col items-center text-center space-y-2">
              <div className="h-14 w-14 bg-primary/10 rounded-[1.8rem] flex items-center justify-center text-primary mb-1 shadow-inner">
                <MapPin className="h-7 w-7" />
              </div>
              <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">
                DELIVERY <span className="text-primary">AREA.</span>
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select your serving zone for accuracy</DialogDescription>
            </DialogHeader>

            <div className="flex bg-muted/50 p-1 rounded-2xl">
              <button 
                onClick={() => setView('list')}
                className={cn("flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", view === 'list' ? "bg-white shadow-sm" : "text-gray-400")}
              >
                SELECT ZONE
              </button>
              <button 
                onClick={() => setView('map')}
                className={cn("flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", view === 'map' ? "bg-white shadow-sm" : "text-gray-400")}
              >
                PICK ON MAP
              </button>
            </div>

            {view === 'list' ? (
              <div className="space-y-4">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search city, area or pincode..." 
                    className="h-12 rounded-2xl bg-gray-50 border-none pl-11 font-bold text-sm shadow-inner"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <button 
                  onClick={handleUseGPS}
                  disabled={isProcessing}
                  className="w-full h-14 bg-primary/5 border-2 border-primary/10 rounded-2xl flex items-center justify-center gap-3 text-primary font-black uppercase italic text-xs hover:bg-primary/10 transition-all active:scale-95"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
                  USE DEVICE GPS (AUTO DETECT)
                </button>

                <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                  {filteredZones.map((zone) => (
                    <button 
                      key={zone.id} 
                      onClick={() => handleSelectZone(zone)}
                      className="w-full text-left p-4 rounded-2xl bg-gray-50/50 hover:bg-primary/5 flex items-center justify-between border-2 border-transparent transition-all group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-black text-gray-800 truncate uppercase italic">{zone.name}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">{zone.city} {zone.pincodes?.[0] ? `(${zone.pincodes[0]})` : ''}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="h-[300px] w-full bg-muted rounded-[2rem] overflow-hidden border-2 border-gray-100 relative">
                  <MapPicker 
                    onConfirm={(lat, lng) => {
                      const matched = zones?.find(z => isPointInPolygon(lat, lng, z.boundary || []));
                      if (matched) handleSelectZone(matched, [lat, lng]);
                      else toast({ variant: "destructive", title: "Outside Zone", description: "Service unavailable in this specific map area." });
                    }} 
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        {isProcessing && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest mt-4">Verifying Area...</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
