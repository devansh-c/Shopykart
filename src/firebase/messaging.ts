
'use client';

import { getMessaging, Messaging, isSupported, getToken } from 'firebase/messaging';
import { initializeFirebase } from './index';

let messagingInstance: Messaging | null = null;

export async function getFirebaseMessaging() {
  if (typeof window === 'undefined') return null;
  
  const supported = await isSupported();
  if (!supported) {
    console.warn("FCM is not supported in this browser.");
    return null;
  }

  if (!messagingInstance) {
    const { firebaseApp } = initializeFirebase();
    if (firebaseApp) {
      messagingInstance = getMessaging(firebaseApp);
    }
  }
  return messagingInstance;
}

export async function requestPushToken() {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    // Register Service Worker explicitly for FCM
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      
      const token = await getToken(messaging, {
        vapidKey: 'BIsC7y7uP9x_Xv6lZ-G_pX_Xv6lZ-G_pX_Xv6lZ-G_pX_Xv6lZ-G_pX_Xv6lZ-G_pX_Xv6lZ-G_pX_Xv6lZ-G_p', // Aapko Firebase Console se VAPID key yahan dalni hogi
        serviceWorkerRegistration: registration
      });

      return token;
    }
  } catch (err) {
    console.error("Failed to get FCM Token:", err);
    return null;
  }
  return null;
}
