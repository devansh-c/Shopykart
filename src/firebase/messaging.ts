
'use client';

import { getMessaging, Messaging, isSupported, getToken } from 'firebase/messaging';
import { initializeFirebase } from './index';

let messagingInstance: Messaging | null = null;

/**
 * @fileOverview Firebase Cloud Messaging (FCM) Setup.
 * Handles token generation for background push notifications and permission checks.
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
 */
export async function requestPushToken() {
  try {
    // Check permission first
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return null;
      }
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        console.warn("No active service worker found for FCM.");
        return null;
      }
      
      const vapidKey = 'BIsC7y7uP9x_Xv6lZ-G_pX_Xv6lZ-G_pX_Xv6lZ-G_pX_Xv6lZ-G_p'; 

      try {
        const token = await getToken(messaging, {
          vapidKey: vapidKey,
          serviceWorkerRegistration: registration
        });
        return token;
      } catch (tokenErr: any) {
        console.warn("FCM Token Error:", tokenErr.message);
        return null;
      }
    }
  } catch (err) {
    console.warn("FCM Registration skipped:", err);
    return null;
  }
  return null;
}
