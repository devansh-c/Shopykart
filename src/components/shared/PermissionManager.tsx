'use client';

import { useEffect } from 'react';

export default function PermissionManager() {
  useEffect(() => {
    let isMounted = true;

    const setupPermissionsAndFCM = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;

        const { PushNotifications } = await import('@capacitor/push-notifications');
        const { Geolocation } = await import('@capacitor/geolocation');

        // 1. Android Notification Channel (Order alerts ke liye zaroori)
        try {
          await PushNotifications.createChannel({
            id: 'shopykart_orders',
            name: 'Order Updates',
            description: 'Alerts for order confirmation and delivery status',
            importance: 5,
            visibility: 1,
            vibration: true,
            sound: 'default'
          });
        } catch (e) {
          console.warn('Channel creation error:', e);
        }

        // 2. Token listeners
        await PushNotifications.removeAllListeners();

        PushNotifications.addListener('registration', (token) => {
          localStorage.setItem('shopykart_fcm_token', token.value);
          localStorage.setItem('fcm_token', token.value);
        });

        PushNotifications.addListener('registrationError', (err) => {
          console.error('FCM Registration Error:', err);
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push received in foreground:', notification);
        });

        // 3. Pehle Notification Permission mangien
        let pushPerm = await PushNotifications.checkPermissions();
        if (pushPerm.receive !== 'granted') {
          pushPerm = await PushNotifications.requestPermissions();
        }

        if (pushPerm.receive === 'granted') {
          await PushNotifications.register();
        }

        // 4. Notification ke 800ms baad Location Permission mangien
        setTimeout(async () => {
          if (!isMounted) return;
          try {
            let locPerm = await Geolocation.checkPermissions();
            if (locPerm.location !== 'granted') {
              await Geolocation.requestPermissions();
            }
          } catch (e) {
            console.warn('Location prompt error:', e);
          }
        }, 800);

      } catch (err) {
        console.warn('PermissionManager setup error:', err);
      }
    };

    const timer = setTimeout(setupPermissionsAndFCM, 600);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  return null;
}
