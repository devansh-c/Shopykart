'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { Loader2, MapPin, Crosshair, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const containerStyle = {
  width: '100%',
  height: '100%'
};

// Mauranipur/Ranipur Center
const defaultCenter = {
  lat: 25.2443,
  lng: 79.0838
};

const libraries: ("places")[] = ["places"];

interface GoogleMapPickerProps {
  onConfirm: (lat: number, lng: number, address?: string) => void;
  forcedInitialCenter?: { lat: number; lng: number };
}

/**
 * @fileOverview Absolute Precision Google Map Picker (Zomato Style).
 * Center-locked static pin with draggable map and auto-address resolution.
 */
export default function GoogleMapPicker({ onConfirm, forcedInitialCenter }: GoogleMapPickerProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  
  // Initialize with forced center or default
  const [center, setCenter] = useState(forcedInitialCenter || defaultCenter);
  const [isLocating, setIsLocating] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  // Synchronize map when forcedInitialCenter arrives
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
    if (forcedInitialCenter) {
      mapInstance.setCenter(forcedInitialCenter);
      mapInstance.setZoom(19);
    }
  }, [forcedInitialCenter]);

  const onAutocompleteLoad = (auto: google.maps.places.Autocomplete) => {
    setAutocomplete(auto);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const newCoords = { lat, lng };
        setCenter(newCoords);
        map?.setCenter(newCoords);
        map?.setZoom(19);
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
        setResolvedAddress("Unknown Area");
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
        setCenter({ lat, lng });
        reverseGeocode(lat, lng);
      }
    }
  };

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    
    const options = {
      enableHighAccuracy: true,
      timeout: 15000, 
      maximumAge: 0   
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCenter(coords);
        if (map) {
          map.setCenter(coords);
          map.setZoom(19);
        }
        reverseGeocode(coords.lat, coords.lng);
        setIsLocating(false);
      },
      (err) => {
        console.warn("GPS Precision Error:", err.message);
        setIsLocating(false);
      },
      options
    );
  };

  if (!isLoaded) return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-white">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">SYNCING SATELLITE ENGINE...</p>
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
          styles: [
            { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
          ]
        }}
      >
        {/* Floating Top Search */}
        <div className="absolute top-6 left-4 right-4 z-[1001]">
          <Autocomplete 
            onLoad={onAutocompleteLoad} 
            onPlaceChanged={onPlaceChanged}
          >
            <div className="relative shadow-2xl rounded-[1.25rem] overflow-hidden border border-black/5">
              <input 
                type="text"
                placeholder="Search Your Building Name" 
                className="w-full h-12 pl-4 pr-12 bg-white border-none font-bold text-xs text-gray-900 focus:outline-none placeholder:text-gray-400"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-900">
                <Search className="h-5 w-5 stroke-[2.5]" />
              </div>
            </div>
          </Autocomplete>
        </div>

        {/* ZOMATO STYLE CENTERED PIN */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[1000] pointer-events-none mb-1">
          <div className="relative flex flex-col items-center">
            <div className="bg-[#0B0B0B] text-white text-[8px] font-black px-3 py-1.5 rounded-full mb-1 uppercase tracking-widest animate-bounce shadow-2xl border border-white/20">
               DELIVER HERE
            </div>
            <div className="relative">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center border-4 border-white shadow-2xl scale-110">
                <MapPin className="h-6 w-6 text-white fill-white" />
              </div>
              <div className="w-1.5 h-6 bg-black mx-auto -mt-1 rounded-full shadow-lg opacity-40" />
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

        {/* BOTTOM CONFIRMATION SHEET */}
        <div className="absolute bottom-6 left-4 right-4 z-[1001] flex flex-col gap-2">
           <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-black/5">
              <div className="flex items-center gap-3">
                 <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    {isResolving ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <MapPin className="h-5 w-5 text-primary" />}
                 </div>
                 <div className="flex-1 min-w-0">
                   <p className="text-[11px] font-black text-gray-900 line-clamp-1 uppercase tracking-tight italic">
                      {isResolving ? 'IDENTIFYING DOORSTEP...' : resolvedAddress || 'DRAG MAP TO YOUR DOOR'}
                   </p>
                   <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">ESTABLISHING PRECISION COORDINATES</p>
                 </div>
              </div>
           </div>
           
           <button 
            onClick={() => onConfirm(center.lat, center.lng, resolvedAddress)}
            className="w-full h-16 bg-[#BDC3C7] hover:bg-black hover:text-white text-gray-900 rounded-[2rem] font-black uppercase text-base shadow-xl active:scale-95 transition-all tracking-tighter"
           >
            PICK THIS LOCATION
          </button>
        </div>
      </GoogleMap>
    </div>
  );
}
