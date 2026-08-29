'use client';

import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  useMap 
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';

function MapResizer({ lat, lng }: { lat: number, lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    if (lat && lng) {
      map.setView([lat, lng], 17);
      const timer = setTimeout(() => {
        if (map && (map as any)._container) {
          map.invalidateSize();
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [lat, lng, map]);
  return null;
}

type OrderMapViewerProps = {
  lat: number;
  lng: number;
};

export default function OrderMapViewer({ lat, lng }: OrderMapViewerProps) {
  const [icon, setIcon] = useState<any>(null);

  useEffect(() => {
    // Dynamic import to prevent SSR crash
    const initLeaflet = async () => {
      const L = (await import('leaflet')).default;
      const markerIcon = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
        iconSize: [45, 45],
        iconAnchor: [22, 45],
        popupAnchor: [0, -45],
      });
      setIcon(markerIcon);
    };
    initLeaflet();
  }, []);

  if (!icon) return <div className="h-full w-full bg-muted animate-pulse rounded-3xl" />;

  return (
    <div className="h-full w-full">
      <MapContainer 
        center={[lat, lng]} 
        zoom={17} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapResizer lat={lat} lng={lng} />
        <Marker position={[lat, lng]} icon={icon} />
      </MapContainer>
    </div>
  );
}
