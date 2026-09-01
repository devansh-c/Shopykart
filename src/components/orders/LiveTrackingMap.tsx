'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, OverlayView } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
 * @fileOverview Advanced Live Tracking Map.
 * Features: Circular Store Image Markers, Multi-Vendor Display, Customer Drop Pin.
 */
export default function LiveTrackingMap({ 
  customerLat, 
  customerLng, 
  vendors,
  customerName, 
  onEtaUpdate 
}: LiveTrackingMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script-global',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places', 'geometry'],
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Sanitize coordinates to prevent NaN crashes
  const cLat = parseFloat(String(customerLat));
  const cLng = parseFloat(String(customerLng));
  const isValidCustomer = !isNaN(cLat) && !isNaN(cLng);

  // Calculate center based on all valid points
  const center = useMemo(() => {
    if (!isValidCustomer) return defaultCenter;
    return { lat: cLat, lng: cLng };
  }, [cLat, cLng, isValidCustomer]);

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    if (!isValidCustomer) return;

    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: cLat, lng: cLng });
    
    let hasVendors = false;
    vendors.forEach(v => {
      if (v.lat && v.lng) {
        bounds.extend({ lat: parseFloat(String(v.lat)), lng: parseFloat(String(v.lng)) });
        hasVendors = true;
      }
    });

    if (hasVendors) {
      mapInstance.fitBounds(bounds, { top: 80, bottom: 220, left: 60, right: 60 });
    } else {
      mapInstance.setZoom(16);
    }
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

    const timer = setTimeout(calculateEta, 2000);
    return () => clearTimeout(timer);
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
      {/* 1. RENDER ALL VENDORS AS CIRCULAR IMAGE MARKERS */}
      {vendors.map((vendor, idx) => {
        const vLat = parseFloat(String(vendor.lat));
        const vLng = parseFloat(String(vendor.lng));
        if (isNaN(vLat) || isNaN(vLng)) return null;

        return (
          <OverlayView
            key={vendor.id || idx}
            position={{ lat: vLat, lng: vLng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div className="relative -translate-x-1/2 -translate-y-full mb-1 group">
               {/* Label Tag */}
               <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white px-2 py-0.5 rounded shadow-md border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  <span className="text-[9px] font-black text-gray-800 uppercase italic">{vendor.storeName}</span>
               </div>
               
               {/* Circular Image Container */}
               <div className="h-10 w-10 rounded-full border-4 border-white shadow-xl overflow-hidden bg-muted transform-gpu transition-transform group-hover:scale-125">
                  <img 
                    src={vendor.imageUrl || 'https://cdn-icons-png.flaticon.com/512/619/619032.png'} 
                    className="h-full w-full object-cover"
                    alt={vendor.storeName}
                  />
               </div>
               
               {/* Arrow pointer */}
               <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white mx-auto shadow-sm" />
            </div>
          </OverlayView>
        );
      })}

      {/* 2. CUSTOMER DROP MARKER */}
      {isValidCustomer && (
        <>
          <Marker 
            position={{ lat: cLat, lng: cLng }}
            icon={{
              url: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
              scaledSize: new google.maps.Size(38, 38),
              anchor: new google.maps.Point(19, 38)
            }}
          />
          <InfoWindow position={{ lat: cLat, lng: cLng }} options={{ disableAutoPan: true }}>
             <div className="bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100">
                <span className="text-[10px] font-black text-gray-800 uppercase italic whitespace-nowrap">{customerName}</span>
             </div>
          </InfoWindow>
        </>
      )}

    </GoogleMap>
  );
}
