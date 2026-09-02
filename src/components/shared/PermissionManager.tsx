'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * @fileOverview Global Permission Manager to request Location, Notification, Camera and Gallery.
 * Triggers on app mount across all portals (Customer, Admin, Vendor, Delivery).
 */
export default function PermissionManager() {
  const { toast } = useToast();
  const [hasRequested, setHasRequested] = useState(false);

  useEffect(() => {
    // Prevent multiple requests in one session
    const alreadyAsked = sessionStorage.getItem('permissions_requested');
    if (alreadyAsked === 'true' || hasRequested) return;

    const requestAllPermissions = async () => {
      console.log("System: Initiating Global Permission Sync...");
      
      // 1. NOTIFICATION PERMISSION
      if ('Notification' in window) {
        try {
          if (Notification.permission === 'default') {
            await Notification.requestPermission();
          }
        } catch (e) {
          console.warn("Notification prompt skipped");
        }
      }

      // 2. LOCATION PERMISSION
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          () => console.log("Location Access: Granted"),
          () => console.warn("Location Access: Denied"),
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }

      // 3. CAMERA & MICROPHONE PERMISSION (Triggers Gallery too in many mobile browsers)
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: false 
          });
          // Stop stream immediately after permission is granted
          stream.getTracks().forEach(track => track.stop());
          console.log("Media Access: Granted");
        } catch (e) {
          console.warn("Media Access: Denied/Skipped");
        }
      }

      sessionStorage.setItem('permissions_requested', 'true');
      setHasRequested(true);
    };

    // Trigger after a small delay for smoother splash-to-app transition
    const timer = setTimeout(requestAllPermissions, 3000);
    return () => clearTimeout(timer);
  }, [hasRequested]);

  return null;
}
