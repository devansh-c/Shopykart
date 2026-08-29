'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  useMapEvents,
  useMap
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Check, Loader2, MapPin, Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';

// Internal component to track the center of the map accurately
function CenterTracker({ onPositionChange }: { onPositionChange: (pos: [number, number]) => void }) {
  const map = useMapEvents({
    moveend() {
      const center = map.getCenter();
      onPositionChange([
        Number(center.lat.toFixed(8)), 
        Number(center.lng.toFixed(8))
      ]);
    },
  });

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[1000] pointer-events-none mb-8">
      <div className="relative flex flex-col items-center">
        {/* Floating Label */}
        <div className="bg-black text-white text-[8px] font-black px-2 py-1 rounded mb-1 uppercase tracking-widest animate-bounce shadow-lg">
          Set Delivery Spot
        </div>
        {/* Fixed Center Pin */}
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

// Internal component to fly to current location
function LocationTrigger({ onLocate }: { onLocate: (lat: number, lng: number) => void }) {
  const map = useMap();
  const [isLocating, setIsLocating] = useState(false);

  const handleLocate = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 18);
        onLocate(latitude, longitude);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  return (
    <button 
      onClick={handleLocate}
      className="absolute bottom-6 right-6 z-[1000] h-12 w-12 bg-white rounded-2xl shadow-2xl flex items-center justify-center text-primary border border-gray-100 active:scale-90 transition-all"
    >
      <Crosshair className={cn("h-6 w-6", isLocating && "animate-spin")} />
    </button>
  );
}

export default function MapPicker({ onConfirm }: { onConfirm: (lat: number, lng: number) => void }) {
  // Default center for Mauranipur/Ranipur area
  const [currentPos, setCurrentPos] = useState<[number, number]>([25.2443, 79.0838]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  if (!isReady) return <div className="h-full w-full bg-muted animate-pulse flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="h-full w-full relative bg-gray-100 flex flex-col">
      {/* Map Area */}
      <div className="flex-1 relative">
        <MapContainer 
          center={currentPos} 
          zoom={16} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          {/* HIGH-DETAIL STREET MAP TILES (CartoDB Voyager) - NO KEY NEEDED */}
          <TileLayer 
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains='abcd'
          />
          <CenterTracker onPositionChange={setCurrentPos} />
          <LocationTrigger onLocate={(lat, lng) => setCurrentPos([lat, lng])} />
        </MapContainer>
      </div>

      {/* Confirmation Sheet */}
      <div className="bg-white p-6 pt-8 rounded-t-[3rem] shadow-[0_-20px_60px_rgba(0,0,0,0.15)] z-[1001] space-y-6">
        <div className="flex items-start gap-4 px-2">
           <div className="h-11 w-11 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
              <MapPin className="h-5 w-5" />
           </div>
           <div className="flex-1 min-w-0">
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Confirm Location</h4>
              <p className="text-sm font-bold text-gray-800 leading-tight italic uppercase tracking-tighter">Move map to place pin exactly at your doorstep</p>
           </div>
        </div>

        <Button 
          onClick={() => onConfirm(currentPos[0], currentPos[1])}
          className="w-full h-16 bg-black hover:bg-gray-900 text-white rounded-[2rem] font-black uppercase italic shadow-2xl active:scale-95 transition-all text-sm tracking-widest border-b-4 border-gray-800"
        >
          <Check className="h-5 w-5 mr-3 stroke-[3]" />
          PICK LOCATION
        </Button>
      </div>
    </div>
  );
}