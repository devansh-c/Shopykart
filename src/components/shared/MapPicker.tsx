'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  useMapEvents,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Check, Navigation, Loader2, Crosshair } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Component to handle map centering and resizing
function MapManager({ targetPos }: { targetPos: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    // Use panTo for smoother and more precise movement than setView
    map.panTo(targetPos, { animate: true, duration: 0.5 });
    
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 400);

    return () => clearTimeout(timer);
  }, [targetPos, map]);
  
  return null;
}

// Component to track map center and update coordinates
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
  // Default to area center (Ranipur)
  const [currentPos, setCurrentPos] = useState<[number, number]>([25.2443, 79.0838]);
  const [isLocating, setIsLocating] = useState(false);
  const { toast } = useToast();
  const mapRef = useRef<L.Map | null>(null);

  // Initial GPS fetch on mount
  useEffect(() => {
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
      toast({ 
        variant: "destructive", 
        title: "Not Supported", 
        description: "GPS is not available on this device." 
      });
      return;
    }

    setIsLocating(true);
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCurrentPos(newCoords);
        setIsLocating(false);
        toast({ title: "GPS Position Fixed! 📍" });
      },
      (err) => {
        setIsLocating(false);
        let msg = "Please enable location in settings.";
        if (err.code === 1) msg = "Location access denied.";
        if (err.code === 3) msg = "GPS signal weak. Try moving near a window.";
        
        toast({ 
          variant: "destructive", 
          title: "Position Failed", 
          description: msg 
        });
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 0 
      }
    );
  }, [toast]);

  return (
    <div className="h-full w-full relative bg-gray-100">
      <MapContainer 
        center={currentPos} 
        zoom={17} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        ref={mapRef}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapManager targetPos={currentPos} />
        <CenterTracker onPositionChange={setCurrentPos} />
      </MapContainer>
      
      {/* Floating Precision Locate Button */}
      <button 
        onClick={handleLocateMe}
        disabled={isLocating}
        className="absolute top-4 right-4 z-[1000] bg-white h-12 w-12 rounded-2xl shadow-2xl border border-border flex items-center justify-center text-primary active:scale-90 transition-all hover:bg-gray-50"
      >
        {isLocating ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <Crosshair className="h-6 w-6" />
        )}
      </button>

      {/* Accuracy Guide */}
      <div className="absolute top-4 left-4 z-[1000] pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[8px] font-black text-white uppercase tracking-widest">Live Precision Map</span>
        </div>
      </div>

      <div className="absolute bottom-6 left-0 right-0 px-6 z-[1000] space-y-3">
        <Button 
          onClick={() => onConfirm(currentPos[0], currentPos[1])}
          className="w-full h-16 bg-black hover:bg-gray-900 text-white rounded-[2rem] font-black uppercase italic shadow-2xl active:scale-95 transition-all text-sm tracking-widest"
        >
          <Check className="h-5 w-5 mr-3" />
          CONFIRM PIN LOCATION
        </Button>
        
        <p className="text-center text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] bg-white/80 backdrop-blur-sm py-1 rounded-full w-fit mx-auto px-4">
          Move map to adjust exact spot
        </p>
      </div>
    </div>
  );
}
