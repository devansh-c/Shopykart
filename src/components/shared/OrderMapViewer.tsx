'use client';

import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

// Custom Marker Icon for pinpoint accuracy
const markerIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [45, 45],
  iconAnchor: [22, 45],
  popupAnchor: [0, -45],
});

function MapResizer({ lat, lng }: { lat: number, lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;

    if (lat && lng) {
      map.setView([lat, lng], 17);
      
      // Essential for React-Leaflet inside Modals/Dialogs
      // Added safety check and cleanup to prevent "_leaflet_pos" undefined error
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
  return (
    <div className="h-full w-full">
      <MapContainer 
        center={[lat, lng]} 
        zoom={17} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <MapResizer lat={lat} lng={lng} />
        <Marker position={[lat, lng]} icon={markerIcon} />
      </MapContainer>
    </div>
  );
}
