
'use client';

import { useEffect } from 'react';
import { requestPushToken } from '@/firebase/messaging';

/**
 * @fileOverview Global Permission Manager.
 * Ensures the app asks for essential permissions (Notifications, GPS) on startup.
 * Enhanced for Android 13+ support.
 */
export default function PermissionManager() {
  useEffect(() => {
    const askPermissions = async () => {
      if (typeof window === 'undefined') return;

      // Small delay to let the app settle
      setTimeout(async () => {
        try {
          // 1. Notification Permission - Forced request
          if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              console.log("Notification permission granted.");
              // Get Token if granted
              await requestPushToken();
            }
          }

          // 2. Location Permission (Trigger system prompt)
          if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
              () => { console.log("Location permission granted."); }, 
              () => { console.log("Location permission denied."); }, 
              { enableHighAccuracy: false, timeout: 5000 }
            );
          }
        } catch (err) {
          console.debug("Silent permission check skip", err);
        }
      }, 3000);
    };

    askPermissions();
  }, []);

  return null;
}
