
'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  useMapEvents,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Navigation, Check } from 'lucide-react';

const icon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

function MapManager({ currentPos }: { currentPos: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(currentPos, map.getZoom());
  }, [currentPos, map]);
  return null;
}

function LocationMarker({ onPositionChange }: { onPositionChange: (pos: [number, number]) => void }) {
  const map = useMapEvents({
    move() {
      const center = map.getCenter();
      onPositionChange([center.lat, center.lng]);
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

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentPos([pos.coords.latitude, pos.coords.longitude]),
        () => {},
        { enableHighAccuracy: true }
      );
    }
  }, []);

  return (
    <div className="h-full w-full relative">
      <MapContainer 
        center={currentPos} 
        zoom={15} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapManager currentPos={currentPos} />
        <LocationMarker onPositionChange={setCurrentPos} />
      </MapContainer>
      
      <div className="absolute bottom-6 left-0 right-0 px-6 z-[1000]">
        <Button 
          onClick={() => onConfirm(currentPos[0], currentPos[1])}
          className="w-full h-12 bg-black text-white rounded-2xl font-black uppercase italic shadow-2xl active:scale-95 transition-all"
        >
          <Check className="h-4 w-4 mr-2" />
          CONFIRM PIN LOCATION
        </Button>
      </div>
    </div>
  );
}
