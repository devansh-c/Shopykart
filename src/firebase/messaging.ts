
'use client';

import { getMessaging, Messaging, isSupported, getToken } from 'firebase/messaging';
import { initializeFirebase } from './index';
import { doc, getDoc } from 'firebase/firestore';

let messagingInstance: Messaging | null = null;

/**
 * @fileOverview Firebase Cloud Messaging (FCM) Setup.
 */
export async function getFirebaseMessaging() {
  if (typeof window === 'undefined') return null;
  
  try {
    const supported = await isSupported();
    if (!supported) return null;

    if (!messagingInstance) {
      const { firebaseApp } = initializeFirebase();
      if (firebaseApp) {
        messagingInstance = getMessaging(firebaseApp);
      }
    }
    return messagingInstance;
  } catch (err) {
    return null;
  }
}

/**
 * Requests FCM token after verifying notification permissions.
 */
export async function requestPushToken() {
  try {
    const { firestore } = initializeFirebase();
    if (!firestore) return null;

    // 1. Get VAPID Key
    const brandingSnap = await getDoc(doc(firestore, 'app_settings', 'branding'));
    const vapidKey = brandingSnap.data()?.vapidKey || 'BC5Gx8VDwyRgNuv-SzJPZnqkcCCDzrhZnJ4SsGfK65Z9_SkQRYjSSfZraLlUpxIwGenba0GpsQAnnatRwSQ-VKo';

    // 2. Request Permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return null;
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    // 3. Register SW and Get Token
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      
      const token = await getToken(messaging, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration
      });
      
      return token;
    }
  } catch (err) {
    console.error("FCM Token Error:", err);
    return null;
  }
  return null;
}
