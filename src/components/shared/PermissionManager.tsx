
'use client';

import { useEffect } from 'react';
import { requestPushToken } from '@/firebase/messaging';

/**
 * @fileOverview Global Permission Manager.
 * Ensures the app asks for essential permissions (Notifications, GPS) on startup.
 * Enhanced for Android 13+ support with aggressive prompt logic.
 */
export default function PermissionManager() {
  useEffect(() => {
    const askPermissions = async () => {
      if (typeof window === 'undefined') return;

      // Small delay to let the app settle before annoying user with popups
      setTimeout(async () => {
        try {
          // 1. Notification Permission - Forced request for Android 13+
          if ('Notification' in window) {
            const currentPermission = Notification.permission;
            if (currentPermission !== 'granted') {
              const permission = await Notification.requestPermission();
              if (permission === 'granted') {
                console.log("Notification permission granted by user.");
                await requestPushToken();
              }
            } else {
              // Already granted, just ensure token is fresh
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
      }, 5000); // 5 seconds delay is better for UX
    };

    askPermissions();
  }, []);

  return null;
}
