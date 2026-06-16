'use client';

import { useState, useEffect } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  useMapEvents,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Check, Navigation, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function MapManager({ currentPos }: { currentPos: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;

    map.setView(currentPos, map.getZoom());
    
    // Fix container size on mount to ensure pin is centered
    const timer = setTimeout(() => {
      if (map && (map as any)._container) {
        map.invalidateSize();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [currentPos, map]);
  return null;
}

function LocationMarker({ onPositionChange }: { onPositionChange: (pos: [number, number]) => void }) {
  const map = useMapEvents({
    moveend() {
      const center = map.getCenter();
      // Using precise number formatting to prevent rounding errors
      onPositionChange([
        Number(center.lat.toFixed(8)), 
        Number(center.lng.toFixed(8))
      ]);
    }
  });

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[1000] pointer-events-none mb-5">
      <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" className="w-10 h-10 animate-bounce" alt="Pin" />
      <div className="w-2 h-2 bg-black/20 rounded-full blur-[2px] mx-auto mt-[-5px]" />
    </div>
  );
}

export default function MapPicker({ onConfirm }: { onConfirm: (lat: number, lng: number) => void }) {
  const [currentPos, setCurrentPos] = useState<[number, number]>([25.2443, 79.0838]);
  const [isLocating, setIsLocating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentPos([pos.coords.latitude, pos.coords.longitude]),
        () => {},
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "Not Supported", description: "Your browser doesn't support GPS." });
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
        toast({ variant: "destructive", title: "GPS Access Denied", description: "Please enable location in settings." });
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="h-full w-full relative">
      <MapContainer 
        center={currentPos} 
        zoom={16} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapManager currentPos={currentPos} />
        <LocationMarker onPositionChange={setCurrentPos} />
      </MapContainer>
      
      {/* Floating Locate Me Button */}
      <button 
        onClick={handleLocateMe}
        className="absolute top-4 right-4 z-[1000] bg-white h-12 w-12 rounded-2xl shadow-2xl border border-border flex items-center justify-center text-primary active:scale-90 transition-all"
      >
        {isLocating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Navigation className="h-5 w-5" />}
      </button>

      <div className="absolute bottom-6 left-0 right-0 px-6 z-[1000] space-y-3">
        <button 
          onClick={handleLocateMe}
          disabled={isLocating}
          className="w-full h-12 bg-white text-black border-2 border-black rounded-2xl font-black uppercase italic text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
        >
          {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
          USE MY CURRENT LOCATION
        </button>

        <Button 
          onClick={() => onConfirm(currentPos[0], currentPos[1])}
          className="w-full h-14 bg-black text-white rounded-[1.5rem] font-black uppercase italic shadow-2xl active:scale-95 transition-all"
        >
          <Check className="h-5 w-5 mr-2" />
          CONFIRM PIN LOCATION
        </Button>
      </div>
    </div>
  );
}
