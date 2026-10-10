
'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { requestPushToken, syncTokenToFirestore } from '@/firebase/messaging';

/**
 * @fileOverview Permission Manager - Manages Notifications & FCM registration.
 * Coordinates between Web Push and Native Capacitor.
 */
export default function PermissionManager() {
  const { user } = useUser();
  const firestore = useFirestore();
  const registrationDone = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const setupNotifications = async () => {
      if (!isMounted) return;

      try {
        const { Capacitor } = await import('@capacitor/core');
        
        // 1. NATIVE ANDROID SETUP
        if (Capacitor.isNativePlatform()) {
          const { PushNotifications } = await import('@capacitor/push-notifications');

          await PushNotifications.createChannel({
            id: 'fcm_default_channel',
            name: 'General Notifications',
            description: 'Order and promotional alerts',
            importance: 5,
            visibility: 1,
            vibration: true,
            sound: 'default'
          });

          PushNotifications.addListener('registration', async (token) => {
            console.log('=== NATIVE FCM TOKEN ===', token.value);
            localStorage.setItem('shopykart_fcm_token', token.value);
            if (user?.uid) {
              await syncTokenToFirestore(user.uid, token.value);
            }
          });

          let perm = await PushNotifications.checkPermissions();
          if (perm.receive !== 'granted') {
            perm = await PushNotifications.requestPermissions();
          }

          if (perm.receive === 'granted') {
            await PushNotifications.register();
          }
        } 
        
        // 2. WEB BROWSER SETUP (Always try for fallback)
        if (!registrationDone.current) {
          const token = await requestPushToken(user?.uid);
          if (token) registrationDone.current = true;
        }

      } catch (err) {
        console.error('Notification setup failed:', err);
      }
    };

    // Delay to prevent blocking initial render
    const timer = setTimeout(setupNotifications, 3000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [user, firestore]);

  return null;
}
