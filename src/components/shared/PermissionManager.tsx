
'use client';

import { useEffect } from 'react';
import { requestPushToken } from '@/firebase/messaging';

/**
 * @fileOverview Global Permission Manager.
 * Optimized for Android 13+ support with aggressive prompt logic for Play Store.
 */
export default function PermissionManager() {
  useEffect(() => {
    const askPermissions = async () => {
      if (typeof window === 'undefined') return;

      // Small delay to let the app settle
      setTimeout(async () => {
        try {
          // 1. Notification Permission - Forced request for Android 13+
          if ('Notification' in window) {
            const currentPermission = Notification.permission;
            if (currentPermission !== 'granted') {
              const permission = await Notification.requestPermission();
              if (permission === 'granted') {
                console.log("Notification permission granted.");
                await requestPushToken();
              }
            } else {
              await requestPushToken();
            }
          }

          // 2. Location Permission (Mandatory for Delivery Accuracy)
          if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
              () => { console.log("GPS granted."); }, 
              () => { console.log("GPS denied."); }, 
              { enableHighAccuracy: true, timeout: 5000 }
            );
          }
        } catch (err) {
          console.debug("Permission check skip", err);
        }
      }, 3000); 
    };

    askPermissions();
  }, []);

  return null;
}
