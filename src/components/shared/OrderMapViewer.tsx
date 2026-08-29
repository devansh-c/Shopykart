'use client';

import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Polyline,
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
  const [storeIcon, setStoreIcon] = useState<any>(null);

  // Store Hub Location (Center of Mauranipur/Ranipur)
  const storePos: [number, number] = [25.2443, 79.0838];

  useEffect(() => {
    const initLeaflet = async () => {
      const L = (await import('leaflet')).default;
      const markerIcon = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
        iconSize: [45, 45],
        iconAnchor: [22, 45],
        popupAnchor: [0, -45],
      });
      const hubIcon = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/619/619032.png',
        iconSize: [35, 35],
        iconAnchor: [17, 35],
      });
      setIcon(markerIcon);
      setStoreIcon(hubIcon);
    };
    initLeaflet();
  }, []);

  if (!icon || !storeIcon) return <div className="h-full w-full bg-muted animate-pulse rounded-3xl" />;

  return (
    <div className="h-full w-full">
      <MapContainer 
        center={[lat, lng]} 
        zoom={17} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        {/* HIGH-DETAIL STREET MAP TILES (CartoDB Voyager) */}
        <TileLayer 
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains='abcd'
        />
        <MapResizer lat={lat} lng={lng} />
        
        {/* Visual Shortest Route Line */}
        <Polyline 
          positions={[storePos, [lat, lng]]} 
          pathOptions={{ color: '#3B82F6', weight: 4, dashArray: '10, 10', opacity: 0.7 }}
        />

        <Marker position={storePos} icon={storeIcon} />
        <Marker position={[lat, lng]} icon={icon} />
      </MapContainer>
    </div>
  );
}