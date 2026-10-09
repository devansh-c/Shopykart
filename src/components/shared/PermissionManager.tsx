'use client';

import { useEffect } from 'react';

/**
 * @fileOverview SSR-Safe Permission Manager.
 * Capacitor modules are imported dynamically to prevent server-side crashes.
 */
export default function PermissionManager() {
  useEffect(() => {
    const requestAppPermissions = async () => {
      try {
        // Dynamic imports to ensure browser-only execution
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;

        const { PushNotifications } = await import('@capacitor/push-notifications');
        const { Geolocation } = await import('@capacitor/geolocation');

        // 1. Request Notification Permission (Delayed for better UX)
        setTimeout(async () => {
          let pushPerm = await PushNotifications.checkPermissions();
          if (pushPerm.receive !== 'granted') {
            pushPerm = await PushNotifications.requestPermissions();
          }

          if (pushPerm.receive === 'granted') {
            await PushNotifications.register();
          }
        }, 2500);

        // 2. Request Location Permission
        let locPerm = await Geolocation.checkPermissions();
        if (locPerm.location !== 'granted') {
          await Geolocation.requestPermissions();
        }
      } catch (err) {
        console.warn('Permission request error:', err);
      }
    };

    // Trigger after initial mount
    const timer = setTimeout(() => {
      requestAppPermissions();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
