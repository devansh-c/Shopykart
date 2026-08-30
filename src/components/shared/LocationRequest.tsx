'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * @fileOverview Universal Location and GPS Permission Picker.
 * Automatically requests GPS on mount to trigger OS permission prompt.
 * Strictly using High-Accuracy mode.
 */
export default function LocationRequest() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const zonesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'zones'), where('isActive', '==', true));
  }, [firestore]);
  
  const { data: activeZones } = useCollection<any>(zonesQuery);

  useEffect(() => {
    const isBot = /bot|googlebot|crawler|spider|robot|crawling|lighthouse|headless|xml-sitemaps/i.test(navigator.userAgent);
    if (isBot) return;

    // AUTO TRIGGER GPS PERMISSION PROMPT ON START
    const handleAutoDetect = () => {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          
          // Reverse Geocode using Google Maps API
          try {
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
            const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`);
            const data = await response.json();
            
            if (data.results && data.results[0]) {
              const address = data.results[0].formatted_address;
              const shortAddress = data.results[0].address_components.find((c: any) => c.types.includes('sublocality'))?.long_name || 
                                   data.results[0].address_components.find((c: any) => c.types.includes('locality'))?.long_name || "Detected Location";

              localStorage.setItem('user_plus_code', `${lat},${lng}`);
              localStorage.setItem('user_address', shortAddress);
              localStorage.setItem('user_address_line', address);
              localStorage.setItem('user_location_set', 'true');
              
              window.dispatchEvent(new CustomEvent('user-address-updated'));
            }
          } catch (e) {
            console.error("Geocoding failed", e);
          }
        },
        () => {
          // If denied, we can't do auto-detection, but the ZoneGuard will handle the 'Unavailable' state
          console.warn("Location permission denied");
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    };

    // Delay slightly to ensure browser is ready
    const timer = setTimeout(handleAutoDetect, 2000);
    return () => clearTimeout(timer);
  }, [activeZones]);

  return null; // Silent background handler
}
