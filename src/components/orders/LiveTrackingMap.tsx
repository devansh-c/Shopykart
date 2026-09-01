
'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '100%'
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

/**
 * @fileOverview Live Tracking Map with Google Maps API.
 * Matches Zomato-style labels and branded markers.
 * Optimized: Synchronized libraries to prevent Loader mismatch errors.
 */
export default function LiveTrackingMap({ 
  customerLat, 
  customerLng, 
  vendorLat, 
  vendorLng, 
  customerName, 
  storeName,
  onEtaUpdate 
}: LiveTrackingMapProps) {
  // CRITICAL: Libraries must match exactly with other useJsApiLoader calls in the app
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script-global',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places', 'geometry'],
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const center = useMemo(() => {
    if (vendorLat && vendorLng) {
      return { 
        lat: (customerLat + vendorLat) / 2, 
        lng: (customerLng + vendorLng) / 2 
      };
    }
    return { lat: customerLat, lng: customerLng };
  }, [customerLat, customerLng, vendorLat, vendorLng]);

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    
    // Fit bounds to show both pins
    if (vendorLat && vendorLng) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: customerLat, lng: customerLng });
      bounds.extend({ lat: vendorLat, lng: vendorLng });
      mapInstance.fitBounds(bounds, { top: 100, bottom: 400, left: 50, right: 50 });
    }
  }, [customerLat, customerLng, vendorLat, vendorLng]);

  // ETA CALCULATION
  useEffect(() => {
    if (!isLoaded || !vendorLat || !vendorLng) return;

    const calculateEta = () => {
      const service = new google.maps.DistanceMatrixService();
      service.getDistanceMatrix({
        origins: [{ lat: vendorLat, lng: vendorLng }],
        destinations: [{ lat: customerLat, lng: customerLng }],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      }, (response, status) => {
        if (status === 'OK' && response && response.rows[0]?.elements[0]?.status === 'OK') {
          const element = response.rows[0].elements[0];
          const durationValue = Math.ceil(element.duration.value / 60) + 12; // 12 min prep time
          onEtaUpdate(`${durationValue} MINS`);
        } else {
          onEtaUpdate('35 MINS');
        }
      });
    };

    calculateEta();
    const interval = setInterval(calculateEta, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [isLoaded, customerLat, customerLng, vendorLat, vendorLng, onEtaUpdate]);

  if (!isLoaded || !isClient) return (
    <div className="h-full w-full flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
        <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Rendering Satellite View...</p>
      </div>
    </div>
  );

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={14}
      onLoad={onMapLoad}
      options={{
        disableDefaultUI: true,
        styles: [
          {
            "featureType": "all",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#7c93a3" }, { "lightness": "-10" }]
          },
          {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{ "color": "#c8d7d4" }]
          }
        ],
        gestureHandling: 'greedy'
      }}
    >
      {/* VENDOR PIN */}
      {vendorLat && vendorLng && (
        <Marker 
          position={{ lat: vendorLat, lng: vendorLng }}
          icon={{
            url: 'https://cdn-icons-png.flaticon.com/512/619/619032.png',
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 40)
          }}
        >
          <InfoWindow position={{ lat: vendorLat, lng: vendorLng }}>
             <div className="px-2 py-0.5">
                <span className="text-[9px] font-black uppercase italic text-gray-900">{storeName}</span>
             </div>
          </InfoWindow>
        </Marker>
      )}

      {/* CUSTOMER PIN */}
      <Marker 
        position={{ lat: customerLat, lng: customerLng }}
        icon={{
          url: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
          scaledSize: new google.maps.Size(45, 45),
          anchor: new google.maps.Point(22, 45)
        }}
      >
        <InfoWindow position={{ lat: customerLat, lng: customerLng }}>
           <div className="px-2 py-0.5">
              <span className="text-[9px] font-black uppercase italic text-gray-900">{customerName}</span>
           </div>
        </InfoWindow>
      </Marker>

    </GoogleMap>
  );
}
