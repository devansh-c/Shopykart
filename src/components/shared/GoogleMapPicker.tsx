'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { Loader2, MapPin, Crosshair, Check, Search, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const [resolvedAddress, setResolvedAddress] = useState('Detecting address...');
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
        map?.panTo({ lat, lng });
        map?.setZoom(18);
        setConfirmCoords({ lat, lng });
      }
    }
  };

  // Reverse Geocoding Logic using Geocoding API
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
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (map) {
          map.panTo(coords);
          map.setZoom(18);
        }
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true }
    );
  };

  if (!isLoaded) return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-white">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Syncing Google Logistics...</p>
    </div>
  );

  return (
    <div className="h-full w-full relative bg-gray-100 flex flex-col overflow-hidden">
      {/* MAP AREA */}
      <div className="flex-1 relative">
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
          {/* COMPACT SEARCH BAR - MOVED DOWN A BIT */}
          <div className="absolute top-6 left-4 right-4 z-[1001]">
            <Autocomplete 
              onLoad={onAutocompleteLoad} 
              onPlaceChanged={onPlaceChanged}
            >
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Find your building or area..." 
                  className="h-12 pl-11 pr-4 rounded-xl bg-white border-none shadow-2xl font-bold text-[11px] focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>
            </Autocomplete>
          </div>

          {/* PRECISION CENTER PIN */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[1000] pointer-events-none mb-6">
            <div className="relative flex flex-col items-center">
              <div className="bg-black text-white text-[7px] font-black px-2 py-0.5 rounded mb-1 uppercase tracking-widest animate-bounce shadow-lg">
                DROP PIN
              </div>
              <div className="relative">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center border-4 border-white shadow-2xl">
                  <MapPin className="h-5 w-5 text-white fill-white" />
                </div>
                <div className="w-1 h-4 bg-black mx-auto -mt-1 rounded-full shadow-lg" />
              </div>
            </div>
          </div>
        </GoogleMap>

        <button 
          onClick={handleLocate}
          className="absolute bottom-4 right-4 z-[1000] h-10 w-10 bg-white rounded-xl shadow-xl flex items-center justify-center text-primary border border-gray-100 active:scale-90 transition-all"
        >
          <Crosshair className={cn("h-5 w-5", isLocating && "animate-spin")} />
        </button>
      </div>

      {/* ULTRA-COMPACT ADDRESS FOOTER - MINIMIZED WHITE SPACE */}
      <div className="bg-white p-3 pt-4 rounded-t-[2.5rem] shadow-[0_-15px_50px_rgba(0,0,0,0.1)] z-[1001] space-y-3">
        <div className="flex items-center gap-3 px-1">
          <div className={cn(
            "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 border transition-colors",
            isResolving ? "bg-muted border-border" : "bg-primary/5 border-primary/10 text-primary"
          )}>
            {isResolving ? <Loader2 className="h-5 w-5 animate-spin opacity-20" /> : <MapPin className="h-5 w-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-black text-gray-800 leading-tight italic line-clamp-2 uppercase tracking-tighter">
              {resolvedAddress}
            </p>
          </div>
        </div>

        <Button 
          onClick={() => onConfirm(confirmCoords.lat, confirmCoords.lng, resolvedAddress)}
          className="w-full h-14 bg-[#0B0B0B] hover:bg-black text-white rounded-2xl font-black uppercase italic shadow-xl active:scale-95 transition-all text-xs tracking-widest"
        >
          <Check className="h-4 w-4 mr-2 stroke-[3]" />
          CONFIRM DROP SPOT
        </Button>
      </div>
    </div>
  );
}