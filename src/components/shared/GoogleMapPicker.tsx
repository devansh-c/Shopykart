
'use client';

import React, { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { Loader2, MapPin, Crosshair, Check, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const containerStyle = {
  width: '100%',
  height: '100%'
};

// Default center for Mauranipur/Ranipur area
const defaultCenter = {
  lat: 25.2443,
  lng: 79.0838
};

// Load Places library for Autocomplete
const libraries: ("places")[] = ["places"];

interface GoogleMapPickerProps {
  onConfirm: (lat: number, lng: number) => void;
}

/**
 * @fileOverview GoogleMapPicker with Places API (New) integration.
 * Fixed: Used onIdle to prevent Maximum Update Depth loops.
 * Added: Autocomplete search bar for rapid address finding.
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

  // Capture center only when map stops moving to avoid re-render loops
  const handleOnIdle = () => {
    if (map) {
      const newCenter = map.getCenter();
      if (newCenter) {
        setConfirmCoords({ 
          lat: newCenter.lat(), 
          lng: newCenter.lng() 
        });
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
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Initializing Premium Maps...</p>
    </div>
  );

  return (
    <div className="h-full w-full relative bg-gray-100 flex flex-col">
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
            gestureHandling: 'greedy'
          }}
        >
          {/* Places API (New) Autocomplete Search */}
          <div className="absolute top-4 left-4 right-4 z-[1001]">
            <Autocomplete 
              onLoad={onAutocompleteLoad} 
              onPlaceChanged={onPlaceChanged}
            >
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search your street or building..." 
                  className="h-14 pl-12 rounded-2xl bg-white border-none shadow-2xl font-bold text-sm"
                />
              </div>
            </Autocomplete>
          </div>

          {/* Centered Overlay Pin */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[1000] pointer-events-none mb-8">
            <div className="relative flex flex-col items-center">
              <div className="bg-black text-white text-[8px] font-black px-2 py-1 rounded mb-1 uppercase tracking-widest animate-bounce shadow-lg">
                DROP PIN HERE
              </div>
              <div className="relative">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center border-4 border-white shadow-2xl">
                  <MapPin className="h-6 w-6 text-white fill-white" />
                </div>
                <div className="w-1.5 h-6 bg-black mx-auto -mt-1 rounded-full shadow-lg" />
              </div>
            </div>
          </div>
        </GoogleMap>

        <button 
          onClick={handleLocate}
          className="absolute bottom-6 right-6 z-[1000] h-12 w-12 bg-white rounded-2xl shadow-2xl flex items-center justify-center text-primary border border-gray-100 active:scale-90 transition-all"
        >
          <Crosshair className={cn("h-6 w-6", isLocating && "animate-spin")} />
        </button>
      </div>

      <div className="bg-white p-6 pt-8 rounded-t-[3rem] shadow-[0_-20px_60px_rgba(0,0,0,0.15)] z-[1001] space-y-6">
        <div className="flex items-start gap-4 px-2">
          <div className="h-11 w-11 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Confirm Identity Location</h4>
            <p className="text-sm font-bold text-gray-800 leading-tight italic uppercase tracking-tighter">Pin your doorstep for 10-min delivery accuracy</p>
          </div>
        </div>

        <Button 
          onClick={() => onConfirm(confirmCoords.lat, confirmCoords.lng)}
          className="w-full h-16 bg-black hover:bg-gray-900 text-white rounded-[2rem] font-black uppercase italic shadow-2xl active:scale-95 transition-all text-sm tracking-widest border-b-4 border-gray-800"
        >
          <Check className="h-5 w-5 mr-3 stroke-[3]" />
          CONFIRM DROP SPOT
        </Button>
      </div>
    </div>
  );
}
