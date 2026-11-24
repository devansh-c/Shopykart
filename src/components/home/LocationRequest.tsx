
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';

/**
 * @fileOverview Location Guard Controller.
 * Manages the redirection to /select-location instead of showing a popup.
 * Also handles persistent restoration from Firestore Profile after app updates.
 */
export default function LocationRequest() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user, loading: userLoading } = useUser();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  
  const { data: profile, loading: profileLoading } = useDoc<any>(userProfileRef);

  // Fetch zones to ensure we have valid IDs for restoration
  const zonesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'zones'), where('isActive', '==', true));
  }, [firestore]);
  const { data: activeZones } = useCollection<any>(zonesQuery, 'guard_zones_v1');

  useEffect(() => {
    const checkAndRestoreLocation = async () => {
      if (typeof window === 'undefined') return;
      
      const hasLocationSet = localStorage.getItem('user_location_set') === 'true';
      const activeZone = localStorage.getItem('active_zone_id');
      const isBot = /bot|googlebot|crawler|spider|robot|lighthouse/i.test(navigator.userAgent);
      
      if (isBot) return;

      // 1. AUTO-RESTORE FROM PROFILE (Prevents loss on Play Store Update)
      if (!hasLocationSet && user && !userLoading && !profileLoading && profile?.lastSelectedZoneId) {
        const zoneId = profile.lastSelectedZoneId;
        const zoneName = profile.lastSelectedZone;
        const city = profile.city || 'Local';

        localStorage.setItem('active_zone_id', zoneId);
        localStorage.setItem('user_city', city);
        localStorage.setItem('user_address', zoneName);
        localStorage.setItem('user_location_set', 'true');
        
        window.dispatchEvent(new CustomEvent('user-address-updated'));
        return;
      }

      // 2. REDIRECT IF NO LOCATION FOUND
      if (!hasLocationSet && !userLoading && !profileLoading) {
        // If we are on home and location isn't set, move to selection page
        const isHome = window.location.pathname === '/';
        if (isHome) {
          router.replace('/select-location');
        }
      }
    };

    const timer = setTimeout(checkAndRestoreLocation, 1000);

    const handleOpenManual = () => { router.push('/select-location'); };
    window.addEventListener('open-location-picker', handleOpenManual);
    
    return () => { 
      clearTimeout(timer);
      window.removeEventListener('open-location-picker', handleOpenManual); 
    };
  }, [userLoading, profileLoading, profile, router, user]);

  return null; // Logic-only component, no UI needed as it uses a dedicated page
}
