
'use client';

import { useEffect, useState } from 'react';
import { requestPushToken } from '@/firebase/messaging';

/**
 * @fileOverview Global Permission Manager.
 * Ensures the app asks for essential permissions (Notifications, GPS) on startup.
 */
export default function PermissionManager() {
  useEffect(() => {
    const askPermissions = async () => {
      if (typeof window === 'undefined') return;

      // Small delay to let the app settle
      setTimeout(async () => {
        try {
          // 1. Notification Permission
          if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              // Get Token if granted
              await requestPushToken();
            }
          }

          // 2. Location Permission (Trigger system prompt)
          if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(() => {}, () => {}, { 
              enableHighAccuracy: false, 
              timeout: 5000 
            });
          }
        } catch (err) {
          console.debug("Silent permission check skip");
        }
      }, 3000);
    };

    askPermissions();
  }, []);

  return null;
}
