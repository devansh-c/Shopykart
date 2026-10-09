
'use client';

import { getMessaging, Messaging, isSupported, getToken } from 'firebase/messaging';
import { initializeFirebase } from './index';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

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
 * Requests FCM token and saves it to the user's Firestore document.
 */
export async function requestPushToken(userId?: string) {
  try {
    const { firestore } = initializeFirebase();
    if (!firestore) return null;

    // 1. Get VAPID Key from Branding Settings
    const brandingSnap = await getDoc(doc(firestore, 'app_settings', 'branding'));
    const brandingData = brandingSnap.data();
    const vapidKey = brandingData?.vapidKey || 'BC5Gx8VDwyRgNuv-SzJPZnqkcCCDzrhZnJ4SsGfK65Z9_SkQRYjSSfZraLlUpxIwGenba0GpsQAnnatRwSQ-VKo';

    // 2. Request Permission (Native Browser/OS Prompt)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn("Notification permission denied by user.");
        return null;
      }
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    // 3. Get FCM Token
    let token = '';
    if ('serviceWorker' in navigator) {
      // Ensure we use the messaging service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      token = await getToken(messaging, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration
      });
    } else {
      token = await getToken(messaging, { vapidKey: vapidKey });
    }

    // 4. Save Token to Firestore for Cloud Targeting
    if (token && userId && firestore) {
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        fcmToken: token,
        notificationsEnabled: true,
        lastTokenSync: serverTimestamp()
      });
    }
    
    return token;
  } catch (err) {
    console.error("FCM Token Registration Error:", err);
    return null;
  }
}
