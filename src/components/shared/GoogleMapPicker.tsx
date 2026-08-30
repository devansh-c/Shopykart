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
 * @fileOverview Draggable Map Pin with Real-time Reverse Geocoding.
 * Optimized for Zomato/Swiggy style UX where map moves under a static centered pin.
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

  /**
   * Fetches readable address from coordinates.
   */
  const reverseGeocode = (lat: number, lng: number) => {
    if (!isLoaded) return;
    setIsResolving(true);
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        setResolvedAddress(results[0].formatted_address);
      } else {
        setResolvedAddress("Unknown Location");
      }
      setIsResolving(false);
    });
  };

  /**
   * Standard Draggable Logic: When map drag ends (Idle), 
   * get the center and update the delivery spot.
   */
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

  /**
   * Precision "Current Location" Logic with aggressive GPS options.
   */
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
        zoom={17}
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
        {/* Floating Search Bar */}
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

        {/* STATIC CENTERED PIN - Map moves under this */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[1000] pointer-events-none mb-10">
          <div className="relative flex flex-col items-center">
            <div className="bg-black text-white text-[7px] font-black px-2 py-1 rounded mb-1 uppercase tracking-widest animate-bounce shadow-xl border border-white/20">
               Deliver Here
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
            className="h-12 w-12 bg-white rounded-full shadow-2xl flex items-center justify-center text-[#2ecc71] border border-gray-100 active:scale-90 transition-all"
          >
            <Crosshair className={cn("h-6 w-6", isLocating && "animate-spin")} />
          </button>
        </div>

        {/* BOTTOM CONFIRMATION SHEET */}
        <div className="absolute bottom-6 left-4 right-4 z-[1001] flex flex-col gap-2">
           <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-white/20">
              <div className="flex items-center gap-3">
                 <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    {isResolving ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <MapPin className="h-5 w-5 text-primary" />}
                 </div>
                 <div className="flex-1 min-w-0">
                   <p className="text-[10px] font-black text-gray-800 line-clamp-1 uppercase tracking-tight">
                      {isResolving ? 'Pinpointing Building...' : resolvedAddress || 'Drag map to set exact spot'}
                   </p>
                   <p className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest">Precise Doorstep Location</p>
                 </div>
              </div>
           </div>
           
           <button 
            onClick={() => onConfirm(confirmCoords.lat, confirmCoords.lng, resolvedAddress)}
            className="w-full h-16 bg-[#BDC3C7] hover:bg-black hover:text-white text-gray-800 rounded-2xl font-black uppercase text-base shadow-xl active:scale-95 transition-all tracking-tighter"
           >
            Pick Location
          </button>
        </div>
      </GoogleMap>
    </div>
  );
}
