
'use client';

import { getMessaging, Messaging, isSupported, getToken, onMessage } from 'firebase/messaging';
import { initializeFirebase } from './index';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

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
 * Handles Customers, Vendors, and Delivery Partners safely.
 */
export async function syncTokenToFirestore(userId: string, token: string) {
  try {
    const { firestore } = initializeFirebase();
    if (!firestore || !userId || !token) return;

    // List of collections where user data might reside
    const collections = ['users', 'vendors', 'delivery_partners'];
    
    for (const col of collections) {
      const userRef = doc(firestore, col, userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        // Using setDoc with merge: true is safer than updateDoc 
        // as it won't throw "No document to update" if there's a race condition
        await setDoc(userRef, {
          fcmToken: token,
          notificationsEnabled: true,
          lastTokenSync: serverTimestamp()
        }, { merge: true });
        
        console.log(`FCM Token synced successfully for ${col}`);
        return; // Success, no need to check other collections
      }
    }
    
    console.log("No matching user/partner/vendor document found for token sync.");
  } catch (err) {
    console.error("Token Sync Error:", err);
  }
}

/**
 * Requests FCM token and handles initial setup.
 */
export async function requestPushToken(userId?: string) {
  if (typeof window === 'undefined') return null;

  try {
    const { firestore } = initializeFirebase();
    if (!firestore) return null;

    // 1. Check Permissions
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return null;
      }
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    // 2. Get VAPID Key
    const vapidKey = 'BC5Gx8VDwyRgNuv-SzJPZnqkcCCDzrhZnJ4SsGfK65Z9_SkQRYjSSfZraLlUpxIwGenba0GpsQAnnatRwSQ-VKo';

    // 3. Get Token
    const token = await getToken(messaging, { 
      vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.register('/firebase-messaging-sw.js')
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
    console.error("FCM Token Registration Error:", err);
    return null;
  }
}
