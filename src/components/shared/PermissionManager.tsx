'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

/**
 * @fileOverview Global Permission Manager to request Location, Notification, Camera and Gallery.
 * Smart Logic: Excludes Camera/Media for Customer App to ensure privacy.
 */
export default function PermissionManager() {
  const pathname = usePathname();
  const [hasRequested, setHasRequested] = useState(false);

  useEffect(() => {
    // Prevent multiple requests in one session
    const alreadyAsked = sessionStorage.getItem('permissions_requested');
    if (alreadyAsked === 'true' || hasRequested) return;

    const requestAllPermissions = async () => {
      // Check if user is in a Business/Admin portal
      const isBusinessPortal = 
        pathname.startsWith('/admin') || 
        pathname.startsWith('/vendor') || 
        pathname.startsWith('/delivery') ||
        pathname.startsWith('/Medical') ||
        pathname.startsWith('/Beauty');

      console.log("System: Initiating Context-Aware Permission Sync...");
      
      // 1. NOTIFICATION PERMISSION - For everyone (Alerts)
      if ('Notification' in window) {
        try {
          if (Notification.permission === 'default') {
            await Notification.requestPermission();
          }
        } catch (e) {
          console.warn("Notification prompt skipped");
        }
      }

      // 2. LOCATION PERMISSION - For everyone (Accurate Delivery)
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          () => console.log("Location Access: Granted"),
          () => console.warn("Location Access: Denied"),
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }

      // 3. CAMERA & MEDIA - ONLY for Business Portals (KYC/Product Photos)
      // Excluded for Customer App as requested.
      if (isBusinessPortal && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: false 
          });
          // Stop stream immediately after permission is granted
          stream.getTracks().forEach(track => track.stop());
          console.log("Media Access (Business): Granted");
        } catch (e) {
          console.warn("Media Access: Denied/Skipped");
        }
      } else {
        console.log("Media Access: Skipped for Customer Privacy");
      }

      sessionStorage.setItem('permissions_requested', 'true');
      setHasRequested(true);
    };

    // Trigger after a small delay for smoother splash-to-app transition
    const timer = setTimeout(requestAllPermissions, 3000);
    return () => clearTimeout(timer);
  }, [hasRequested, pathname]);

  return null;
}
