
'use client';

import { getMessaging, Messaging, isSupported, getToken, onMessage } from 'firebase/messaging';
import { initializeFirebase } from './index';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

let messagingInstance: Messaging | null = null;

/**
 * @fileOverview Firebase Cloud Messaging (FCM) Setup for ShopyKart.
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
 * Syncs the FCM token to Firestore so the user can receive cloud pushes.
 */
export async function syncTokenToFirestore(userId: string, token: string) {
  try {
    const { firestore } = initializeFirebase();
    if (!firestore || !userId || !token) return;

    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
      fcmToken: token,
      notificationsEnabled: true,
      lastTokenSync: serverTimestamp()
    });
    console.log("FCM Token synced to user profile:", userId);
  } catch (err) {
    console.error("Token Sync Error:", err);
  }
}

/**
 * Requests FCM token and handles initial setup.
 */
export async function requestPushToken(userId?: string) {
  try {
    const { firestore } = initializeFirebase();
    if (!firestore) return null;

    // 1. Check Permissions
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return null;
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    // 2. Get VAPID Key from Firestore or use default
    const brandingSnap = await getDoc(doc(firestore, 'app_settings', 'branding'));
    const vapidKey = brandingSnap.data()?.vapidKey || 'BC5Gx8VDwyRgNuv-SzJPZnqkcCCDzrhZnJ4SsGfK65Z9_SkQRYjSSfZraLlUpxIwGenba0GpsQAnnatRwSQ-VKo';

    // 3. Get Token
    const token = await getToken(messaging, { vapidKey });
    
    if (token) {
      localStorage.setItem('shopykart_fcm_token', token);
      if (userId) {
        await syncTokenToFirestore(userId, token);
      }
    }
    
    return token;
  } catch (err) {
    console.error("FCM Token Registration Error:", err);
    return null;
  }
}
