'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
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
  vendors: any[];
  customerName: string;
  onEtaUpdate: (eta: string) => void;
}

/**
 * @fileOverview Clean Tracking Map without logos/images.
 * Uses standard geometric markers for a minimal professional look.
 */
export default function LiveTrackingMap({ 
  customerLat, 
  customerLng, 
  vendors,
  onEtaUpdate 
}: LiveTrackingMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script-global',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places', 'geometry'],
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Sanitize coordinates
  const cLat = parseFloat(String(customerLat));
  const cLng = parseFloat(String(customerLng));
  const isValidCustomer = !isNaN(cLat) && !isNaN(cLng);

  const center = useMemo(() => {
    if (!isValidCustomer) return defaultCenter;
    return { lat: cLat, lng: cLng };
  }, [cLat, cLng, isValidCustomer]);

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    if (!isValidCustomer) return;

    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: cLat, lng: cLng });
    
    vendors.forEach(v => {
      if (v.lat && v.lng) {
        bounds.extend({ lat: parseFloat(String(v.lat)), lng: parseFloat(String(v.lng)) });
      }
    });

    mapInstance.fitBounds(bounds, { top: 80, bottom: 220, left: 60, right: 60 });
  }, [cLat, cLng, isValidCustomer, vendors]);

  useEffect(() => {
    if (!isLoaded || !isValidCustomer || vendors.length === 0) return;

    const calculateEta = () => {
      if (typeof google === 'undefined') return;
      
      const firstVendor = vendors.find(v => v.lat && v.lng);
      if (!firstVendor) {
        onEtaUpdate('25 mins');
        return;
      }

      const service = new google.maps.DistanceMatrixService();
      service.getDistanceMatrix({
        origins: [{ lat: Number(firstVendor.lat), lng: Number(firstVendor.lng) }],
        destinations: [{ lat: cLat, lng: cLng }],
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
  }, [isLoaded, cLat, cLng, isValidCustomer, vendors, onEtaUpdate]);

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
      {/* 1. STORE MARKERS (CLEAN DOTS - NO LOGOS) */}
      {vendors.map((vendor, idx) => {
        const vLat = parseFloat(String(vendor.lat));
        const vLng = parseFloat(String(vendor.lng));
        if (isNaN(vLat) || isNaN(vLng)) return null;

        return (
          <Marker
            key={vendor.id || idx}
            position={{ lat: vLat, lng: vLng }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#EF4444",
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: "#FFFFFF"
            }}
          />
        );
      })}

      {/* 2. CUSTOMER MARKER (CLEAN DOT - NO HOUSE LOGO) */}
      {isValidCustomer && (
        <Marker 
          position={{ lat: cLat, lng: cLng }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#3B82F6",
            fillOpacity: 1,
            strokeWeight: 3,
            strokeColor: "#FFFFFF"
          }}
        />
      )}

      {/* 3. VISUAL ROUTE LINE */}
      {isValidCustomer && vendors[0] && (
        <Polyline
          path={[
            { lat: parseFloat(String(vendors[0].lat)), lng: parseFloat(String(vendors[0].lng)) },
            { lat: cLat, lng: cLng }
          ]}
          options={{
            strokeColor: "#3B82F6",
            strokeOpacity: 0.6,
            strokeWeight: 4,
            geodesic: true,
            icons: [{
              icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW },
              offset: '100%',
              repeat: '50px'
            }]
          }}
        />
      )}
    </GoogleMap>
  );
}
