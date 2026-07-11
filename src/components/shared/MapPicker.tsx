
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  useMapEvents,
  useMap
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Check, Navigation, Loader2, Crosshair, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function MapManager({ targetPos }: { targetPos: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.panTo(targetPos, { animate: true, duration: 0.5 });
    // Invalidate size is important when opening in a dialog
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 400);
    return () => clearTimeout(timer);
  }, [targetPos, map]);
  return null;
}

function CenterTracker({ onPositionChange }: { onPositionChange: (pos: [number, number]) => void }) {
  const map = useMapEvents({
    moveend() {
      const center = map.getCenter();
      onPositionChange([
        Number(center.lat.toFixed(8)), 
        Number(center.lng.toFixed(8))
      ]);
    }
  });

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[1000] pointer-events-none mb-8">
      <div className="relative flex flex-col items-center">
        {/* Floating Label */}
        <div className="bg-black text-white text-[8px] font-black px-2 py-1 rounded mb-1 uppercase tracking-widest animate-bounce shadow-lg">
          Set Delivery Spot
        </div>
        {/* Premium Floating Pin */}
        <div className="relative">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center border-4 border-white shadow-2xl">
             <MapPin className="h-6 w-6 text-white fill-white" />
          </div>
          <div className="w-1.5 h-6 bg-black mx-auto -mt-1 rounded-full shadow-lg" />
          <div className="w-4 h-1.5 bg-black/20 rounded-full blur-[2px] mx-auto mt-[-2px]" />
        </div>
      </div>
    </div>
  );
}

export default function MapPicker({ onConfirm }: { onConfirm: (lat: number, lng: number) => void }) {
  const [currentPos, setCurrentPos] = useState<[number, number]>([25.2443, 79.0838]);
  const [isLocating, setIsLocating] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsReady(true);
    // Auto-locate only if permission was already granted previously or attempt now
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentPos([pos.coords.latitude, pos.coords.longitude]),
        () => {},
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, []);

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "Not Supported" });
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentPos([pos.coords.latitude, pos.coords.longitude]);
        setIsLocating(false);
        toast({ title: "Found You! 📍" });
      },
      (err) => {
        setIsLocating(false);
        toast({ variant: "destructive", title: "Location Denied", description: "Please enable GPS to use this feature." });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [toast]);

  if (!isReady) return <div className="h-full w-full bg-muted animate-pulse flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="h-full w-full relative bg-gray-100 flex flex-col">
      {/* Map Area */}
      <div className="flex-1 relative">
        <MapContainer 
          center={currentPos} 
          zoom={17} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapManager targetPos={currentPos} />
          <CenterTracker onPositionChange={setCurrentPos} />
        </MapContainer>
        
        {/* Floating Locate Me Button */}
        <button 
          onClick={handleLocateMe}
          disabled={isLocating}
          className="absolute bottom-8 right-4 z-[1000] bg-white h-14 w-14 rounded-2xl shadow-2xl border border-gray-100 flex flex-col items-center justify-center text-primary active:scale-90 transition-all gap-0.5"
        >
          {isLocating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Crosshair className="h-5 w-5" />}
          <span className="text-[7px] font-black uppercase tracking-tighter">Locate</span>
        </button>
      </div>

      {/* Confirmation Sheet Overlay */}
      <div className="bg-white p-6 pt-8 rounded-t-[3rem] shadow-[0_-20px_60px_rgba(0,0,0,0.15)] z-[1001] space-y-6">
        <div className="flex items-start gap-4 px-2">
           <div className="h-11 w-11 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
              <Navigation className="h-5 w-5" />
           </div>
           <div className="flex-1 min-w-0">
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Confirm Delivery Area</h4>
              <p className="text-sm font-bold text-gray-800 leading-tight italic uppercase tracking-tighter">Move map to place pin at your doorstep</p>
           </div>
        </div>

        <Button 
          onClick={() => onConfirm(currentPos[0], currentPos[1])}
          className="w-full h-16 bg-black hover:bg-gray-900 text-white rounded-[2rem] font-black uppercase italic shadow-2xl active:scale-95 transition-all text-sm tracking-widest border-b-4 border-gray-800"
        >
          <Check className="h-5 w-5 mr-3 stroke-[3]" />
          CONFIRM PIN LOCATION
        </Button>
      </div>
    </div>
  );
}
