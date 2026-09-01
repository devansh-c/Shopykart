'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 25.2443,
  lng: 79.0838
};

interface LiveTrackingMapProps {
  customerLat: number;
  customerLng: number;
  vendorLat?: number;
  vendorLng?: number;
  customerName: string;
  storeName: string;
  onEtaUpdate: (eta: string) => void;
}

export default function LiveTrackingMap({ 
  customerLat, 
  customerLng, 
  vendorLat, 
  vendorLng, 
  customerName, 
  storeName,
  onEtaUpdate 
}: LiveTrackingMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script-global',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places', 'geometry'],
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);

  const center = useMemo(() => {
    const cLat = parseFloat(String(customerLat));
    const cLng = parseFloat(String(customerLng));
    const vLat = vendorLat ? parseFloat(String(vendorLat)) : NaN;
    const vLng = vendorLng ? parseFloat(String(vendorLng)) : NaN;

    if (!isNaN(cLat) && !isNaN(vLat)) {
      return { lat: (cLat + vLat) / 2, lng: (cLng + vLng) / 2 };
    }
    return !isNaN(cLat) ? { lat: cLat, lng: cLng } : defaultCenter;
  }, [customerLat, customerLng, vendorLat, vendorLng]);

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    const cLat = parseFloat(String(customerLat));
    const cLng = parseFloat(String(customerLng));
    const vLat = vendorLat ? parseFloat(String(vendorLat)) : NaN;
    const vLng = vendorLng ? parseFloat(String(vendorLng)) : NaN;

    if (!isNaN(cLat) && !isNaN(vLat)) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: cLat, lng: cLng });
      bounds.extend({ lat: vLat, lng: vLng });
      mapInstance.fitBounds(bounds, { top: 60, bottom: 200, left: 60, right: 60 });
    }
  }, [customerLat, customerLng, vendorLat, vendorLng]);

  useEffect(() => {
    if (!isLoaded || isNaN(parseFloat(String(vendorLat))) || isNaN(parseFloat(String(customerLat)))) return;

    const calculateEta = () => {
      if (typeof google === 'undefined') return;
      const service = new google.maps.DistanceMatrixService();
      service.getDistanceMatrix({
        origins: [{ lat: Number(vendorLat), lng: Number(vendorLng) }],
        destinations: [{ lat: Number(customerLat), lng: Number(customerLng) }],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      }, (response, status) => {
        if (status === 'OK' && response && response.rows[0]?.elements[0]?.status === 'OK') {
          const element = response.rows[0].elements[0];
          const durationValue = Math.ceil(element.duration.value / 60) + 12;
          onEtaUpdate(`${durationValue} mins`);
        } else {
          onEtaUpdate('44 mins');
        }
      });
    };

    calculateEta();
  }, [isLoaded, customerLat, customerLng, vendorLat, vendorLng, onEtaUpdate]);

  if (!isLoaded) return <div className="h-full w-full flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-primary opacity-20" /></div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={15}
      onLoad={onMapLoad}
      options={{
        disableDefaultUI: true,
        styles: [
          { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "color": "#7c93a3" }] },
          { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c8d7d4" }] }
        ],
        gestureHandling: 'greedy'
      }}
    >
      {/* STORE MARKER WITH LABEL AS PER IMAGE */}
      {!isNaN(parseFloat(String(vendorLat))) && (
        <>
          <Marker 
            position={{ lat: Number(vendorLat), lng: Number(vendorLng) }}
            icon={{
              url: 'https://cdn-icons-png.flaticon.com/512/619/619032.png',
              scaledSize: new google.maps.Size(32, 32),
              anchor: new google.maps.Point(16, 32)
            }}
          />
          <InfoWindow position={{ lat: Number(vendorLat), lng: Number(vendorLng) }} options={{ disableAutoPan: true }}>
             <div className="bg-white px-2 py-0.5 rounded shadow-sm">
                <span className="text-[10px] font-black text-gray-800 uppercase italic whitespace-nowrap">{storeName}</span>
             </div>
          </InfoWindow>
        </>
      )}

      {/* CUSTOMER MARKER WITH LABEL AS PER IMAGE */}
      {!isNaN(parseFloat(String(customerLat))) && (
        <>
          <Marker 
            position={{ lat: Number(customerLat), lng: Number(customerLng) }}
            icon={{
              url: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
              scaledSize: new google.maps.Size(38, 38),
              anchor: new google.maps.Point(19, 38)
            }}
          />
          <InfoWindow position={{ lat: Number(customerLat), lng: Number(customerLng) }} options={{ disableAutoPan: true }}>
             <div className="bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100">
                <span className="text-[10px] font-black text-gray-800 uppercase italic whitespace-nowrap">{customerName}</span>
             </div>
          </InfoWindow>
        </>
      )}

    </GoogleMap>
  );
}
