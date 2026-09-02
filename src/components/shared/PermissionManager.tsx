
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * @fileOverview Global Permission Manager with App-Aware Logic.
 * Smart Logic: Uses environment variables + path to detect if it's a Business APK.
 */
export default function PermissionManager() {
  const pathname = usePathname();
  const [hasRequested, setHasRequested] = useState(false);

  useEffect(() => {
    const alreadyAsked = sessionStorage.getItem('permissions_requested');
    if (alreadyAsked === 'true' || hasRequested) return;

    const requestAllPermissions = async () => {
      // 1. DETECT CONTEXT (Is this an Admin/Vendor/Delivery App or Portal?)
      const isAdminApp = process.env.NEXT_PUBLIC_ADMIN_APP === 'true';
      const isBizApp = process.env.NEXT_PUBLIC_BIZ_APP === 'true';
      const isTowApp = process.env.NEXT_PUBLIC_TOW_APP === 'true';
      
      const isBusinessPath = 
        pathname.startsWith('/admin') || 
        pathname.startsWith('/vendor') || 
        pathname.startsWith('/delivery') ||
        pathname.startsWith('/Medical') ||
        pathname.startsWith('/Beauty');

      const isBusinessContext = isAdminApp || isBizApp || isTowApp || isBusinessPath;

      console.log(`System: Permission Sync for ${isBusinessContext ? 'BUSINESS' : 'CUSTOMER'} Context...`);
      
      // 2. UNIVERSAL PERMISSIONS (Notification & Location)
      if ('Notification' in window && Notification.permission === 'default') {
        try { await Notification.requestPermission(); } catch (e) {}
      }

      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(() => {}, () => {}, { timeout: 5000 });
      }

      // 3. SENSITIVE PERMISSIONS (Camera & Media) - ONLY FOR BUSINESS
      if (isBusinessContext && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          stream.getTracks().forEach(track => track.stop());
          console.log("Media Access: Verified for Business Identity");
        } catch (e) {
          console.warn("Media Access: Denied or Unavailable");
        }
      }

      sessionStorage.setItem('permissions_requested', 'true');
      setHasRequested(true);
    };

    const timer = setTimeout(requestAllPermissions, 3000);
    return () => clearTimeout(timer);
  }, [hasRequested, pathname]);

  return null;
}
