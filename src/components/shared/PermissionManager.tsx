'use client';

import { useEffect, useState } from 'react';

/**
 * @fileOverview Global Permission Manager.
 * ONLY requests Location and Notifications. Clean & stable for all apps.
 */
export default function PermissionManager() {
  const [hasRequested, setHasRequested] = useState(false);

  useEffect(() => {
    const alreadyAsked = sessionStorage.getItem('permissions_requested');
    if (alreadyAsked === 'true' || hasRequested) return;

    const requestPermissions = async () => {
      try {
        // 1. NOTIFICATION PERMISSION
        if ('Notification' in window && Notification.permission === 'default') {
          await Notification.requestPermission().catch(() => {});
        }

        // 2. LOCATION PERMISSION (Trigger system prompt)
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(() => {}, () => {}, { 
            enableHighAccuracy: false, 
            timeout: 5000, 
            maximumAge: 60000 
          });
        }

        sessionStorage.setItem('permissions_requested', 'true');
        setHasRequested(true);
      } catch (err) {
        console.warn("Permission Manager silent error:", err);
      }
    };

    const timer = setTimeout(requestPermissions, 2000);
    return () => clearTimeout(timer);
  }, [hasRequested]);

  return null;
}
