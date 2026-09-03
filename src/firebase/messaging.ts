'use client';

import { getMessaging, Messaging, isSupported, getToken } from 'firebase/messaging';
import { initializeFirebase } from './index';
import { doc, getDoc } from 'firebase/firestore';

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
 * Uses VAPID key from branding settings or a default placeholder.
 */
export async function requestPushToken() {
  try {
    const { firestore } = initializeFirebase();
    if (!firestore) return null;

    // 1. Get VAPID Key from Branding Settings
    const brandingSnap = await getDoc(doc(firestore, 'app_settings', 'branding'));
    const vapidKey = brandingSnap.data()?.vapidKey || 'BIsC7y7uP9x_Xv6lZ-G_pX_Xv6lZ-G_pX_Xv6lZ-G_pX_Xv6lZ-G_p';

    // 2. Check permission first
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

    // 3. Register Service Worker for FCM
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        console.warn("No active service worker found for FCM.");
        return null;
      }

      try {
        const token = await getToken(messaging, {
          vapidKey: vapidKey,
          serviceWorkerRegistration: registration
        });
        
        if (token) {
          console.log("FCM Token Generated Successfully.");
          return token;
        }
      } catch (tokenErr: any) {
        console.warn("FCM Token Generation Error:", tokenErr.message);
        return null;
      }
    }
  } catch (err) {
    console.warn("FCM Permission flow interrupted:", err);
    return null;
  }
  return null;
}
