'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * @fileOverview Universal Location and GPS Permission Picker.
 * Automatically requests GPS on mount to trigger OS permission prompt.
 * Strictly using High-Accuracy mode with optimized cache timeout.
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

      // Ensure we don't spam requests if already set
      const isAlreadySet = localStorage.getItem('user_location_set') === 'true';
      const lastCheck = localStorage.getItem('last_location_check');
      const now = Date.now();
      
      // If checked in last 1 hour, don't force detection unless needed
      if (isAlreadySet && lastCheck && (now - parseInt(lastCheck)) < 3600000) return;

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          
          localStorage.setItem('last_location_check', now.toString());

          // Reverse Geocode using Google Maps API
          try {
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
            const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`);
            const data = await response.json();
            
            if (data.results && data.results[0]) {
              const address = data.results[0].formatted_address;
              
              // Extract a clean "area" name
              const subLocality = data.results[0].address_components.find((c: any) => c.types.includes('sublocality_level_1'))?.long_name;
              const locality = data.results[0].address_components.find((c: any) => c.types.includes('locality'))?.long_name;
              
              const shortAddress = subLocality || locality || "Detected Location";

              localStorage.setItem('user_plus_code', `${lat},${lng}`);
              localStorage.setItem('user_address', shortAddress.toUpperCase());
              localStorage.setItem('user_address_line', address.toUpperCase());
              localStorage.setItem('user_location_set', 'true');
              
              window.dispatchEvent(new CustomEvent('user-address-updated'));
            }
          } catch (e) {
            console.error("Geocoding failed", e);
          }
        },
        (err) => {
          console.warn("Location permission denied or timeout:", err.code);
          // Only show error if user is trying to place an order
        },
        { 
          enableHighAccuracy: true, 
          timeout: 15000, 
          maximumAge: 0 // Do not use cached location for better accuracy
        }
      );
    };

    // Delay slightly to ensure browser is ready
    const timer = setTimeout(handleAutoDetect, 2000);
    return () => clearTimeout(timer);
  }, [activeZones]);

  return null; // Silent background handler
}
