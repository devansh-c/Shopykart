'use client';

import { getMessaging, Messaging, isSupported, getToken } from 'firebase/messaging';
import { initializeFirebase } from './index';
import { doc, getDoc } from 'firebase/firestore';

let messagingInstance: Messaging | null = null;

/**
 * @fileOverview Firebase Cloud Messaging (FCM) Setup.
 * Handles token generation for background push notifications and programmatic SW registration.
 */
export async function getFirebaseMessaging() {
  if (typeof window === 'undefined') return null;
  
  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn("FCM is not supported in this browser environment.");
      return null;
    }

    if (!messagingInstance) {
      const { firebaseApp } = initializeFirebase();
      if (firebaseApp) {
        messagingInstance = getMessaging(firebaseApp);
      }
    }
    return messagingInstance;
  } catch (err) {
    console.warn("Messaging initialization failed:", err);
    return null;
  }
}

/**
 * Requests FCM token after verifying notification permissions.
 * Programmatically registers a service worker if not present.
 */
export async function requestPushToken() {
  try {
    const { firestore } = initializeFirebase();
    if (!firestore) return null;

    // 1. Get VAPID Key from Branding Settings or use User Provided Fallback
    const brandingSnap = await getDoc(doc(firestore, 'app_settings', 'branding'));
    const vapidKey = brandingSnap.data()?.vapidKey || 'BC5Gx8VDwyRgNuv-SzJPZnqkcCCDzrhZnJ4SsGfK65Z9_SkQRYjSSfZraLlUpxIwGenba0GpsQAnnatRwSQ-VKo';

    // 2. Check permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return null;
      } else if (Notification.permission !== 'granted') {
        return null;
      }
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    // 3. Programmatic Service Worker Registration for FCM
    if ('serviceWorker' in navigator) {
      // Register dedicated worker for Firebase Messaging
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { 
          scope: '/firebase-cloud-messaging-push-scope' 
        });
        
        const token = await getToken(messaging, {
          vapidKey: vapidKey,
          serviceWorkerRegistration: registration
        });
        
        if (token) {
          console.log("FCM Identity Synced.");
          return token;
        }
      } catch (swErr: any) {
        console.warn("FCM SW Error:", swErr.message);
        return null;
      }
    }
  } catch (err) {
    console.warn("FCM Flow interrupted:", err);
    return null;
  }
  return null;
}
