'use client';

import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { getMessaging, isSupported, getToken, onMessage } from 'firebase/messaging';
import { initializeFirebase } from './index';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function registerPushNotifications(userId?: string) {
  // 1. Android / iOS Native Flow
  if (Capacitor.isNativePlatform()) {
    try {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn('Push notification permission not granted');
        return null;
      }

      // Urgent Order Alerts Sound Channel (Max Priority)
      await PushNotifications.createChannel({
        id: 'order_alerts',
        name: 'Order Ringing Alerts',
        description: 'Loud sound alerts for new incoming orders',
        importance: 5, // High priority heads-up notification
        sound: 'order_alert', // android/app/src/main/res/raw/order_alert.mp3
        visibility: 1,
        vibration: true,
      });

      await PushNotifications.register();

      return new Promise<string | null>((resolve) => {
        PushNotifications.addListener('registration', async (token) => {
          localStorage.setItem('shopykart_fcm_token', token.value);
          if (userId) {
            await syncTokenToFirestore(userId, token.value);
          }
          resolve(token.value);
        });

        PushNotifications.addListener('registrationError', (err) => {
          console.error('Capacitor Push Registration Error: ', err);
          resolve(null);
        });
      });
    } catch (err) {
      console.error('Error setting up native push notifications:', err);
      return null;
    }
  }

  // 2. Web Browser Fallback Flow
  if (typeof window === 'undefined') return null;

  try {
    const supported = await isSupported();
    if (!supported) return null;

    const { firebaseApp } = initializeFirebase();
    if (!firebaseApp) return null;

    const messaging = getMessaging(firebaseApp);
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    if (token) {
      localStorage.setItem('shopykart_fcm_token', token);
      if (userId) {
        await syncTokenToFirestore(userId, token);
      }
      return token;
    }
    return null;
  } catch (err) {
    console.error('Web FCM Token Error:', err);
    return null;
  }
}

export async function syncTokenToFirestore(userId: string, token: string) {
  try {
    const { firestore } = initializeFirebase();
    if (!firestore || !userId) return;

    await setDoc(
      doc(firestore, 'users', userId),
      {
        fcmToken: token,
        lastTokenUpdate: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error syncing FCM token:', err);
  }
}

export const requestPushToken = registerPushNotifications;
