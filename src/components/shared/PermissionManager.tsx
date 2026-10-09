'use client';

import { useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function PermissionManager() {
  useEffect(() => {
    let isMounted = true;

    const initPermissionsAndNotifications = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;

        const { PushNotifications } = await import('@capacitor/push-notifications');
        const { Geolocation } = await import('@capacitor/geolocation');

        // 1. Android Notification Channel (Order Updates ke liye zaroori)
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

        // 2. Token listeners register karein
        await PushNotifications.removeAllListeners();

        PushNotifications.addListener('registration', async (token) => {
          console.log('FCM Token received:', token.value);
          localStorage.setItem('shopykart_fcm_token', token.value);

          // Save token to logged in user doc
          const user = auth.currentUser;
          if (user) {
            try {
              await setDoc(doc(db, 'users', user.uid), {
                fcmToken: token.value,
                updatedAt: new Date().toISOString()
              }, { merge: true });
            } catch (err) {
              console.error('Error saving FCM token to user:', err);
            }
          }
        });

        PushNotifications.addListener('registrationError', (err) => {
          console.error('FCM Registration Error:', err);
        });

        // Foreground notification display listener
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push received in foreground:', notification);
        });

        // 3. Pehle Notification Permission prompt karein
        let pushPerm = await PushNotifications.checkPermissions();
        if (pushPerm.receive !== 'granted') {
          pushPerm = await PushNotifications.requestPermissions();
        }

        if (pushPerm.receive === 'granted') {
          await PushNotifications.register();
        }

        // 4. Notification prompt ke 800ms baad Location Permission mangien
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

    const timer = setTimeout(initPermissionsAndNotifications, 600);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  return null;
}
