
'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '100%'
};

// Safe Default Center (Mauranipur Area)
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

/**
 * @fileOverview Live Tracking Map with Google Maps API.
 * Matches Zomato-style labels and branded markers.
 * Fixed: Robust coordinate validation to prevent NaN errors in setCenter.
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
    // Ensure all values are strictly numbers
    const cLat = parseFloat(String(customerLat));
    const cLng = parseFloat(String(customerLng));
    const vLat = vendorLat ? parseFloat(String(vendorLat)) : NaN;
    const vLng = vendorLng ? parseFloat(String(vendorLng)) : NaN;

    // Validation check for finite numbers
    const isCustomerValid = !isNaN(cLat) && !isNaN(cLng) && isFinite(cLat) && isFinite(cLng);
    const isVendorValid = !isNaN(vLat) && !isNaN(vLng) && isFinite(vLat) && isFinite(vLng);

    if (isCustomerValid && isVendorValid) {
      return { 
        lat: (cLat + vLat) / 2, 
        lng: (cLng + vLng) / 2 
      };
    }

    if (isCustomerValid) {
      return { lat: cLat, lng: cLng };
    }

    if (isVendorValid) {
      return { lat: vLat, lng: vLng };
    }

    return defaultCenter;
  }, [customerLat, customerLng, vendorLat, vendorLng]);

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    
    // Fit bounds to show both pins if valid
    const cLat = parseFloat(String(customerLat));
    const cLng = parseFloat(String(customerLng));
    const vLat = vendorLat ? parseFloat(String(vendorLat)) : NaN;
    const vLng = vendorLng ? parseFloat(String(vendorLng)) : NaN;

    if (!isNaN(cLat) && !isNaN(cLng) && !isNaN(vLat) && !isNaN(vLng)) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: cLat, lng: cLng });
      bounds.extend({ lat: vLat, lng: vLng });
      mapInstance.fitBounds(bounds, { top: 100, bottom: 400, left: 50, right: 50 });
    }
  }, [customerLat, customerLng, vendorLat, vendorLng]);

  // ETA CALCULATION
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
      {!isNaN(parseFloat(String(vendorLat))) && !isNaN(parseFloat(String(vendorLng))) && (
        <Marker 
          position={{ lat: Number(vendorLat), lng: Number(vendorLng) }}
          icon={{
            url: 'https://cdn-icons-png.flaticon.com/512/619/619032.png',
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 40)
          }}
        >
          <InfoWindow position={{ lat: Number(vendorLat), lng: Number(vendorLng) }}>
             <div className="px-2 py-0.5">
                <span className="text-[9px] font-black uppercase italic text-gray-900">{storeName}</span>
             </div>
          </InfoWindow>
        </Marker>
      )}

      {/* CUSTOMER PIN */}
      {!isNaN(parseFloat(String(customerLat))) && !isNaN(parseFloat(String(customerLng))) && (
        <Marker 
          position={{ lat: Number(customerLat), lng: Number(customerLng) }}
          icon={{
            url: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
            scaledSize: new google.maps.Size(45, 45),
            anchor: new google.maps.Point(22, 45)
          }}
        >
          <InfoWindow position={{ lat: Number(customerLat), lng: Number(customerLng) }}>
             <div className="px-2 py-0.5">
                <span className="text-[9px] font-black uppercase italic text-gray-900">{customerName}</span>
             </div>
          </InfoWindow>
        </Marker>
      )}

    </GoogleMap>
  );
}
