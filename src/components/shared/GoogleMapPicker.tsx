'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { Loader2, Crosshair, Search, MapPin, ArrowRight } from 'lucide-react';
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
 * @fileOverview High-Precision Map Picker.
 * Fixed: Geocoding address visibility and instant resolution on mount/move.
 */
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
  
  const lastMapCenter = useRef(forcedInitialCenter || defaultCenter);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // Initialize Geocoder
  useEffect(() => {
    if (isLoaded && typeof google !== 'undefined' && !geocoderRef.current) {
      geocoderRef.current = new google.maps.Geocoder();
      // Initial geocode
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
        setResolvedAddress("Pinned Hub Location");
      }
      setIsResolving(false);
    });
  }, []);

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchInput.trim() || !geocoderRef.current) return;

    setIsResolving(true);
    geocoderRef.current.geocode({ address: searchInput }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const coords = {
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng()
        };
        setCenter(coords);
        lastMapCenter.current = coords;
        map?.setCenter(coords);
        map?.setZoom(19);
        setResolvedAddress(results[0].formatted_address);
      }
      setIsResolving(false);
    });
  };

  const handleOnIdle = () => {
    if (map) {
      const currentCenter = map.getCenter();
      if (currentCenter) {
        const lat = currentCenter.lat();
        const lng = currentCenter.lng();
        
        // Anti-Glitch Precision Check
        const diff = Math.abs(lat - lastMapCenter.current.lat) + Math.abs(lng - lastMapCenter.current.lng);
        if (diff > 0.00001) {
          const newCenter = { lat, lng };
          setCenter(newCenter);
          lastMapCenter.current = newCenter;
          reverseGeocode(lat, lng);
        }
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
        lastMapCenter.current = coords;
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
    <div className="h-full w-full flex flex-col items-center justify-center bg-white gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Syncing Map Hub...</p>
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
          clickableIcons: true,
          gestureHandling: 'greedy',
        }}
      >
        {/* Top Search Area */}
        <div className="absolute top-6 left-4 right-4 z-[1001]">
          <form onSubmit={handleSearch} className="relative shadow-2xl rounded-[1.25rem] overflow-hidden border border-black/5 bg-white">
            <input 
              type="text"
              placeholder="Search house or landmark" 
              value={searchInput}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-12 bg-transparent border-none font-bold text-sm text-gray-900 focus:outline-none placeholder:text-gray-400"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-900 active:scale-90 transition-transform">
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>
        </div>

        {/* The 3D Pin (Fixed in Center) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[90%] z-[1000] pointer-events-none mb-1">
          <div className="relative flex flex-col items-center">
            <div className="bg-[#0B0B0B] text-white text-[7px] font-black px-3 py-1 rounded-lg mb-2 uppercase tracking-widest animate-bounce shadow-2xl border border-white/20">
               CONFIRM SPOT
            </div>
            
            <div className="relative transform-gpu transition-all duration-300 scale-110">
              <svg width="45" height="60" viewBox="0 0 50 65" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_15px_15px_rgba(239,68,68,0.4)]">
                <path 
                  d="M25 0C11.1929 0 0 11.1929 0 25C0 33.5 6 45 25 65C44 45 50 33.5 50 25C50 11.1929 38.8071 0 25 0ZM25 38C17.8203 38 12 32.1797 12 25C12 17.8203 17.8203 12 25 12C32.1797 12 38 17.8203 38 25C38 32.1797 32.1797 38 25 38Z" 
                  fill="#EF4444"
                />
              </svg>
              <div className="w-4 h-1.5 bg-black/20 rounded-full blur-[2px] mx-auto -mt-1 scale-x-125" />
            </div>
          </div>
        </div>

        {/* Floating Locate Button */}
        <div className="absolute bottom-40 right-4 z-[1001]">
          <button 
            onClick={handleLocate}
            className="h-14 w-14 bg-white rounded-full shadow-2xl flex items-center justify-center text-green-600 border border-black/5 active:scale-90 transition-all"
          >
            {isLocating ? <Loader2 className="h-6 w-6 animate-spin" /> : <Crosshair className="h-6 w-6" />}
          </button>
        </div>

        {/* Address & Confirmation Panel */}
        <div className="absolute bottom-0 left-0 right-0 z-[1001] p-4 pb-10 bg-gradient-to-t from-white via-white to-transparent">
           <div className="bg-white rounded-[2.25rem] p-6 shadow-2xl border border-gray-100 mb-4 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-start gap-4">
                 <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                    <MapPin className="h-5 w-5" />
                 </div>
                 <div className="flex-1 min-w-0 pr-2">
                    <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] block mb-1">Selected Drop Location</span>
                    <div className="min-h-[2.5rem] flex items-center">
                       {isResolving ? (
                         <div className="flex items-center gap-2">
                           <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                           <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest italic">Resolving Address...</span>
                         </div>
                       ) : (
                         <p className="text-[12px] font-black text-gray-800 leading-tight line-clamp-2 uppercase italic tracking-tighter">
                           {resolvedAddress || 'Drag map to pin your house'}
                         </p>
                       )}
                    </div>
                 </div>
              </div>
           </div>
           
           <button 
            onClick={() => onConfirm(center.lat, center.lng, resolvedAddress)}
            disabled={isResolving}
            className="w-full h-18 bg-[#0B0B0B] hover:bg-primary text-white rounded-[2rem] font-black uppercase text-base shadow-xl active:scale-95 transition-all tracking-tighter disabled:opacity-50"
           >
            {isResolving ? 'WAITING FOR ADDRESS...' : 'CONFIRM THIS LOCATION'}
          </button>
        </div>
      </GoogleMap>
    </div>
  );
}
