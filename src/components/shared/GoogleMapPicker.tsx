'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { Loader2, MapPin, Crosshair, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 25.2443,
  lng: 79.0838
};

const libraries: ("places")[] = ["places"];

interface GoogleMapPickerProps {
  onConfirm: (lat: number, lng: number, address?: string) => void;
}

/**
 * @fileOverview Extreme Precision Map Picker with Screenshot-Aligned UI.
 * Optimized for maximum GPS accuracy and zero white space.
 */
export default function GoogleMapPicker({ onConfirm }: GoogleMapPickerProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [confirmCoords, setConfirmCoords] = useState(defaultCenter);
  const [isLocating, setIsLocating] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onAutocompleteLoad = (auto: google.maps.places.Autocomplete) => {
    setAutocomplete(auto);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        map?.setCenter({ lat, lng });
        map?.setZoom(18);
        setConfirmCoords({ lat, lng });
      }
    }
  };

  const reverseGeocode = (lat: number, lng: number) => {
    if (!isLoaded) return;
    setIsResolving(true);
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        setResolvedAddress(results[0].formatted_address);
      } else {
        setResolvedAddress("");
      }
      setIsResolving(false);
    });
  };

  const handleOnIdle = () => {
    if (map) {
      const newCenter = map.getCenter();
      if (newCenter) {
        const lat = newCenter.lat();
        const lng = newCenter.lng();
        setConfirmCoords({ lat, lng });
        reverseGeocode(lat, lng);
      }
    }
  };

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    
    // EXTREME ACCURACY SETTINGS: Mandatory Fresh Fetch
    const options = {
      enableHighAccuracy: true,
      timeout: 15000, // 15 seconds to ensure high precision satellite lock
      maximumAge: 0   // No cached data allowed
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (map) {
          map.setCenter(coords);
          map.setZoom(18);
          setConfirmCoords(coords);
          reverseGeocode(coords.lat, coords.lng);
        }
        setIsLocating(false);
      },
      (err) => {
        console.warn("Precision location failed:", err.message);
        setIsLocating(false);
      },
      options
    );
  };

  if (!isLoaded) return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-white">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Syncing Satellites...</p>
    </div>
  );

  return (
    <div className="h-full w-full relative bg-gray-100 flex flex-col overflow-hidden">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={16}
        onLoad={onMapLoad}
        onIdle={handleOnIdle}
        options={{
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: 'greedy',
          styles: [
            { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
          ]
        }}
      >
        {/* Floating Search Bar - Perfectly Positioned */}
        <div className="absolute top-6 left-4 right-4 z-[1001]">
          <Autocomplete 
            onLoad={onAutocompleteLoad} 
            onPlaceChanged={onPlaceChanged}
          >
            <div className="relative shadow-2xl rounded-2xl overflow-hidden">
              <input 
                type="text"
                placeholder="Search House No, Street or Area" 
                className="w-full h-12 pl-4 pr-12 bg-white border-none font-bold text-[13px] text-gray-800 focus:outline-none placeholder:text-gray-400"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-black">
                <Search className="h-5 w-5 stroke-[2.5]" />
              </div>
            </div>
          </Autocomplete>
        </div>

        {/* MATHEMATICALLY CENTERED PIN (No Offset) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[1000] pointer-events-none">
          <div className="relative flex flex-col items-center">
            <div className="relative">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center border-4 border-white shadow-2xl">
                <MapPin className="h-5 w-5 text-white fill-white" />
              </div>
              <div className="w-1 h-3 bg-black mx-auto -mt-1 rounded-full shadow-lg" />
            </div>
          </div>
        </div>

        <div className="absolute bottom-28 right-4 z-[1001]">
          <button 
            onClick={handleLocate}
            className="h-11 w-11 bg-white rounded-full shadow-2xl flex items-center justify-center text-[#2ecc71] border border-gray-100 active:scale-90 transition-all"
          >
            <Crosshair className={cn("h-5 w-5", isLocating && "animate-spin")} />
          </button>
        </div>

        {/* BOTTOM UI - Tight and Space-Optimized */}
        <div className="absolute bottom-6 left-4 right-4 z-[1001] flex flex-col gap-2">
           <div className="bg-white/95 backdrop-blur-md p-2 rounded-xl shadow-2xl border border-white/20">
              <div className="flex items-center gap-3 px-2 py-0.5">
                 <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    {isResolving ? <Loader2 className="h-3 w-3 animate-spin text-primary" /> : <MapPin className="h-4 w-4 text-primary" />}
                 </div>
                 <p className="text-[10px] font-black text-gray-800 line-clamp-1 uppercase tracking-tight">
                    {isResolving ? 'Locking Spot...' : resolvedAddress || 'Align pin at your doorstep'}
                 </p>
              </div>
           </div>
           
           <button 
            onClick={() => onConfirm(confirmCoords.lat, confirmCoords.lng, resolvedAddress)}
            className="w-full h-14 bg-[#BDC3C7] hover:bg-[#AAB7B8] text-white rounded-xl font-black uppercase text-base shadow-xl active:scale-95 transition-all tracking-tight"
           >
            Pick Location
          </button>
        </div>
      </GoogleMap>
    </div>
  );
}
