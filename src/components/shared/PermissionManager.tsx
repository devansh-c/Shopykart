'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { requestPushToken, syncTokenToFirestore } from '@/firebase/messaging';

/**
 * @fileOverview Permission Manager - Manages Notifications & FCM registration.
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
        if (Capacitor && Capacitor.isNativePlatform()) {
          const { PushNotifications } = await import('@capacitor/push-notifications');

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
        
        // 2. WEB/PWA FALLBACK
        if (!registrationDone.current && typeof window !== 'undefined') {
          // Add a small delay to ensure SW is ready
          setTimeout(async () => {
            const token = await requestPushToken(user?.uid || undefined);
            if (token) registrationDone.current = true;
          }, 3000);
        }

      } catch (err) {
        console.error('Notification setup failed:', err);
      }
    };

    setupNotifications();

    return () => {
      isMounted = false;
    };
  }, [user, firestore]);

  return null;
}
