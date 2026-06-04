'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  Firestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { firebaseConfig } from './config';

let appInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

/**
 * Robust Firebase initialization singleton.
 * Forces HTTP long-polling and explicit host configuration to bypass WebSocket/Connection-timeout errors.
 * This is the ultimate fix for the "Could not reach Cloud Firestore backend" error.
 */
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, firestore: null, auth: null };
  }

  if (!appInstance) {
    try {
      // 1. Initialize Firebase App
      appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      
      // 2. Setup Auth with persistence
      authInstance = getAuth(appInstance);
      setPersistence(authInstance, browserLocalPersistence).catch((err) => {
        console.warn("Auth persistence error:", err);
      });

      // 3. CRITICAL CONNECTION FIX:
      // - experimentalForceLongPolling: true (Bypasses firewalls/proxies that block WebSockets)
      // - experimentalAutoDetectLongPolling: false (Ensures we don't even waste 10s trying WebSockets)
      // - host: 'firestore.googleapis.com' (Direct route to the backend)
      // - localCache: Enables multiple tabs support for a smoother experience
      firestoreInstance = initializeFirestore(appInstance, {
        host: 'firestore.googleapis.com',
        ssl: true,
        experimentalForceLongPolling: true,
        experimentalAutoDetectLongPolling: false,
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });

      console.log("ShopyKart Firebase: Ultra-Reliable Connection Engine Active ✅");

    } catch (error) {
      console.error("Firebase initialization failed:", error);
    }
  }

  return { 
    firebaseApp: appInstance, 
    firestore: firestoreInstance, 
    auth: authInstance 
  };
}
