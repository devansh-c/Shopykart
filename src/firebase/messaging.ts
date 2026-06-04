'use client';

import { getMessaging, Messaging, isSupported, getToken } from 'firebase/messaging';
import { initializeFirebase } from './index';

let messagingInstance: Messaging | null = null;

/**
 * @fileOverview Firebase Cloud Messaging (FCM) Setup.
 * Handles token generation for background push notifications.
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

export async function requestPushToken() {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    // Register Service Worker explicitly for FCM background handling
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      
      // IMPORTANT: Replace the 'YOUR_VAPID_KEY' with your actual key from 
      // Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
      const vapidKey = 'BIsC7y7uP9x_Xv6lZ-G_pX_Xv6lZ-G_pX_Xv6lZ-G_pX_Xv6lZ-G_p'; 

      try {
        const token = await getToken(messaging, {
          vapidKey: vapidKey,
          serviceWorkerRegistration: registration
        });
        return token;
      } catch (tokenErr: any) {
        if (tokenErr.code === 'messaging/token-subscribe-failed') {
          console.warn("FCM Subscription failed. Please ensure Cloud Messaging is enabled in Firebase Console and VAPID key is correct.");
        } else {
          console.warn("Could not retrieve FCM token:", tokenErr.message);
        }
        return null;
      }
    }
  } catch (err) {
    console.warn("FCM Registration skipped:", err);
    return null;
  }
  return null;
}
