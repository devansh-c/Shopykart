
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { Loader2, Crosshair, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const containerStyle = {
  width: '100%',
  height: '100%'
};

// Default Center (Mauranipur)
const defaultCenter = {
  lat: 25.2443,
  lng: 79.0838
};

interface GoogleMapPickerProps {
  onConfirm: (lat: number, lng: number, address?: string) => void;
  forcedInitialCenter?: { lat: number; lng: number };
}

/**
 * @fileOverview High-Precision Map Picker using Geocoding API.
 * Updated with custom 3D Red Pin matching user reference.
 */
export default function GoogleMapPicker({ onConfirm, forcedInitialCenter }: GoogleMapPickerProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(forcedInitialCenter || defaultCenter);
  const [isLocating, setIsLocating] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [searchInput, setSearchQuery] = useState('');

  useEffect(() => {
    if (forcedInitialCenter && isLoaded) {
      setCenter(forcedInitialCenter);
      if (map) {
        map.setCenter(forcedInitialCenter);
        map.setZoom(19);
      }
      reverseGeocode(forcedInitialCenter.lat, forcedInitialCenter.lng);
    }
  }, [forcedInitialCenter, isLoaded, map]);

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const reverseGeocode = (lat: number, lng: number) => {
    if (!isLoaded || typeof google === 'undefined') return;
    setIsResolving(true);
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        setResolvedAddress(results[0].formatted_address);
      } else {
        setResolvedAddress("Current Selected Spot");
      }
      setIsResolving(false);
    });
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchInput.trim() || !isLoaded) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: searchInput }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const coords = {
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng()
        };
        setCenter(coords);
        map?.setCenter(coords);
        map?.setZoom(19);
        setResolvedAddress(results[0].formatted_address);
      }
    });
  };

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
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  if (!isLoaded) return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-white">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="h-full w-full relative bg-gray-100 flex flex-col overflow-hidden">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={18}
        onLoad={onMapLoad}
        onIdle={handleOnIdle}
        options={{
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: 'greedy',
          styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }]
        }}
      >
        {/* Simple Search Input */}
        <div className="absolute top-6 left-4 right-4 z-[1001]">
          <form onSubmit={handleSearch} className="relative shadow-2xl rounded-[1.25rem] overflow-hidden border border-black/5">
            <input 
              type="text"
              placeholder="Search Area or Building" 
              value={searchInput}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-4 pr-12 bg-white border-none font-bold text-xs text-gray-900 focus:outline-none placeholder:text-gray-400"
            />
            <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-900 active:scale-90 transition-transform">
              <Search className="h-5 w-5 stroke-[2.5]" />
            </button>
          </form>
        </div>

        {/* 3D Static Center Pin matching User Reference */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[90%] z-[1000] pointer-events-none mb-1">
          <div className="relative flex flex-col items-center">
            <div className="bg-[#0B0B0B] text-white text-[8px] font-black px-3 py-1.5 rounded-full mb-2 uppercase tracking-widest animate-bounce shadow-2xl border border-white/20">
               PIN HERE
            </div>
            
            {/* Premium 3D Red Pin SVG */}
            <div className="relative transform-gpu transition-all duration-300 scale-110">
              <svg width="50" height="65" viewBox="0 0 50 65" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_15px_15px_rgba(239,68,68,0.4)]">
                <defs>
                  <radialGradient id="pinGradient" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(25 25) rotate(90) scale(35)">
                    <stop stopColor="#FF4D4D"/>
                    <stop offset="1" stopColor="#B30000"/>
                  </radialGradient>
                  <filter id="innerShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
                    <feOffset dx="2" dy="2"/>
                    <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadow"/>
                    <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.3 0"/>
                  </filter>
                </defs>
                {/* Main Teardrop Shape */}
                <path 
                  d="M25 0C11.1929 0 0 11.1929 0 25C0 33.5 6 45 25 65C44 45 50 33.5 50 25C50 11.1929 38.8071 0 25 0ZM25 38C17.8203 38 12 32.1797 12 25C12 17.8203 17.8203 12 25 12C32.1797 12 38 17.8203 38 25C38 32.1797 32.1797 38 25 38Z" 
                  fill="url(#pinGradient)"
                />
                {/* Shine Layer */}
                <path 
                  d="M15 10C10 15 8 20 8 25" 
                  stroke="white" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeOpacity="0.3"
                />
              </svg>
              {/* Shadow on Ground */}
              <div className="w-4 h-1.5 bg-black/20 rounded-full blur-[2px] mx-auto -mt-1 scale-x-125" />
            </div>
          </div>
        </div>

        <div className="absolute bottom-32 right-4 z-[1001]">
          <button 
            onClick={handleLocate}
            className="h-12 w-12 bg-white rounded-full shadow-2xl flex items-center justify-center text-green-600 border border-black/5 active:scale-90 transition-all"
          >
            <Crosshair className={cn("h-6 w-6", isLocating && "animate-spin")} />
          </button>
        </div>

        {/* Selection Confirmation */}
        <div className="absolute bottom-6 left-4 right-4 z-[1001] flex flex-col gap-2">
           <button 
            onClick={() => onConfirm(center.lat, center.lng, resolvedAddress)}
            className="w-full h-16 bg-black hover:bg-primary text-white rounded-[2rem] font-black uppercase text-base shadow-xl active:scale-95 transition-all tracking-tighter"
           >
            PICK THIS LOCATION
          </button>
        </div>
      </GoogleMap>
    </div>
  );
}
