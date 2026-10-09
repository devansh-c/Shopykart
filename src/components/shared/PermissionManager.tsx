'use client';

import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export default function PermissionManager() {
  useEffect(() => {
    // Only execute natively on Android/iOS app
    if (!Capacitor.isNativePlatform()) return;

    const requestAppPermissions = async () => {
      try {
        // 1. Request Notification Permission
        let pushPerm = await PushNotifications.checkPermissions();
        if (pushPerm.receive !== 'granted') {
          pushPerm = await PushNotifications.requestPermissions();
        }

        if (pushPerm.receive === 'granted') {
          await PushNotifications.register();
        }

        // 2. Request Location Permission right after
        let locPerm = await Geolocation.checkPermissions();
        if (locPerm.location !== 'granted') {
          await Geolocation.requestPermissions();
        }
      } catch (err) {
        console.warn('Permission request error:', err);
      }
    };

    // Trigger 800ms after splash screen/initial mount
    const timer = setTimeout(() => {
      requestAppPermissions();
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
