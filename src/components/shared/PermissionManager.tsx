
'use client';

import { useEffect, useState } from 'react';

/**
 * @fileOverview Global Permission Manager.
 * Simplified to ONLY request Location and Notifications for all apps.
 * Removed Camera, Gallery, and Media access to prevent crashes and privacy concerns.
 */
export default function PermissionManager() {
  const [hasRequested, setHasRequested] = useState(false);

  useEffect(() => {
    // Check if we already requested in this session
    const alreadyAsked = sessionStorage.getItem('permissions_requested');
    if (alreadyAsked === 'true' || hasRequested) return;

    const requestPermissions = async () => {
      try {
        console.log("System: Initiating essential permission requests...");

        // 1. NOTIFICATION PERMISSION
        if ('Notification' in window && Notification.permission === 'default') {
          try {
            await Notification.requestPermission();
          } catch (notifyErr) {
            console.warn("Notification request skipped or failed:", notifyErr);
          }
        }

        // 2. LOCATION PERMISSION
        // Triggering a dummy geolocation call to invoke the system prompt
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            () => {
              console.log("Location Access: Granted");
            }, 
            (err) => {
              console.warn("Location Access: Denied or error", err.message);
            }, 
            { 
              enableHighAccuracy: false, 
              timeout: 5000, 
              maximumAge: 60000 
            }
          );
        }

        sessionStorage.setItem('permissions_requested', 'true');
        setHasRequested(true);
      } catch (globalErr) {
        console.error("Permission Manager Error:", globalErr);
      }
    };

    // Delay request by 2 seconds to ensure app is fully hydrated and visible
    const timer = setTimeout(requestPermissions, 2000);
    return () => clearTimeout(timer);
  }, [hasRequested]);

  return null;
}
