'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { Loader2, Crosshair, Search, MapPin, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 25.2443,
  lng: 79.0838
};

interface GoogleMapPickerProps {
  onConfirm: (lat: number, lng: number, address?: string) => void;
  forcedInitialCenter?: { lat: number; lng: number };
}

export default function GoogleMapPicker({ onConfirm, forcedInitialCenter }: GoogleMapPickerProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script-global',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places', 'geometry'],
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(forcedInitialCenter || defaultCenter);
  const [isLocating, setIsLocating] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [searchInput, setSearchQuery] = useState('');
  
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    if (isLoaded && typeof google !== 'undefined' && !geocoderRef.current) {
      geocoderRef.current = new google.maps.Geocoder();
      reverseGeocode(center.lat, center.lng);
    }
  }, [isLoaded]);

  const reverseGeocode = useCallback((lat: number, lng: number) => {
    if (!geocoderRef.current) return;
    
    setIsResolving(true);
    geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        setResolvedAddress(results[0].formatted_address);
      } else {
        setResolvedAddress("Pinned Delivery Spot");
      }
      setIsResolving(false);
    });
  }, []);

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const handleOnIdle = () => {
    if (map) {
      const currentCenter = map.getCenter();
      if (currentCenter) {
        const lat = currentCenter.lat();
        const lng = currentCenter.lng();
        setCenter({ lat, lng });
        reverseGeocode(lat, lng);
      }
    }
  };

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCenter(coords);
        map?.setCenter(coords);
        map?.setZoom(19);
        reverseGeocode(coords.lat, coords.lng);
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true }
    );
  };

  if (!isLoaded) return <div className="h-full w-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="h-full w-full relative flex flex-col">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={18}
        onLoad={onMapLoad}
        onIdle={handleOnIdle}
        options={{ disableDefaultUI: true, gestureHandling: 'greedy' }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[90%] z-[1000] pointer-events-none">
          <div className="relative flex flex-col items-center">
            <div className="bg-black text-white text-[8px] font-black px-2 py-1 rounded-lg mb-2 uppercase animate-bounce">Confirm Spot</div>
            <MapPin className="h-10 w-10 text-primary drop-shadow-xl" />
          </div>
        </div>

        <div className="absolute bottom-40 right-4 z-[1001]">
          <button onClick={handleLocate} className="h-12 w-12 bg-white rounded-full shadow-2xl flex items-center justify-center text-green-600">
            {isLocating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Crosshair className="h-5 w-5" />}
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-[1001] p-4 bg-white rounded-t-[2.5rem] shadow-2xl">
           <div className="p-4 bg-gray-50 rounded-2xl mb-4 border border-gray-100 min-h-[4rem]">
              <span className="text-[8px] font-black text-primary uppercase block mb-1">Pick Location</span>
              {isResolving ? (
                <div className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /><span className="text-xs font-bold text-gray-400">Resolving...</span></div>
              ) : (
                <p className="text-[11px] font-black text-gray-800 leading-tight uppercase italic">{resolvedAddress || 'Move map to pin house'}</p>
              )}
           </div>
           <button 
            onClick={() => onConfirm(center.lat, center.lng, resolvedAddress)}
            disabled={isResolving}
            className="w-full h-16 bg-black text-white rounded-[1.5rem] font-black uppercase text-base shadow-xl active:scale-95 transition-all"
           >
            CONFIRM THIS SPOT
          </button>
        </div>
      </GoogleMap>
    </div>
  );
}
