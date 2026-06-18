
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
import { Check, Navigation, Loader2, Crosshair } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function MapManager({ targetPos }: { targetPos: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.panTo(targetPos, { animate: true, duration: 0.5 });
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
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[1000] pointer-events-none mb-5">
      <div className="relative">
        <img 
          src="https://cdn-icons-png.flaticon.com/512/684/684908.png" 
          className="w-10 h-10 animate-in bounce-in duration-500" 
          alt="Pin" 
        />
        <div className="w-2 h-2 bg-black/20 rounded-full blur-[2px] mx-auto mt-[-5px]" />
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
        toast({ title: "GPS Position Fixed! 📍" });
      },
      (err) => {
        setIsLocating(false);
        toast({ variant: "destructive", title: "Position Failed" });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [toast]);

  if (!isReady) return <div className="h-full w-full bg-muted animate-pulse flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="h-full w-full relative bg-gray-100">
      <MapContainer 
        center={currentPos} 
        zoom={17} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapManager targetPos={currentPos} />
        <CenterTracker onPositionChange={setCurrentPos} />
      </MapContainer>
      
      <button 
        onClick={handleLocateMe}
        disabled={isLocating}
        className="absolute top-4 right-4 z-[1000] bg-white h-12 w-12 rounded-2xl shadow-2xl border border-border flex items-center justify-center text-primary active:scale-90 transition-all"
      >
        {isLocating ? <Loader2 className="h-6 w-6 animate-spin" /> : <Crosshair className="h-6 w-6" />}
      </button>

      <div className="absolute bottom-6 left-0 right-0 px-6 z-[1000] space-y-3">
        <Button 
          onClick={() => onConfirm(currentPos[0], currentPos[1])}
          className="w-full h-16 bg-black hover:bg-gray-900 text-white rounded-[2rem] font-black uppercase italic shadow-2xl active:scale-95 transition-all text-sm tracking-widest"
        >
          <Check className="h-5 w-5 mr-3" />
          CONFIRM PIN LOCATION
        </Button>
      </div>
    </div>
  );
}
