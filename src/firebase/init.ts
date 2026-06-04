'use client';

import { initializeApp, getApps, getApp, FirebaseApp, setLogLevel } from 'firebase/app';
import { 
  Firestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { firebaseConfig } from './config';

let appInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

/**
 * Super-Resilient Firebase initialization singleton.
 * Specifically optimized for WebViews (APKs) and unstable networks.
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

      // 3. Prevent Console Noise: Next.js Dev Red Screen usually intercepts console.error.
      // Firebase logs connection timeouts as errors. We set it to silent for cleaner dev experience.
      setLogLevel('silent');

      // 4. ULTRA-RELIABLE CONNECTION SETTINGS:
      // - experimentalForceLongPolling: true (Bypasses all WebSocket blocks)
      // - experimentalAutoDetectLongPolling: false (No timeout waiting for WebSockets)
      // - useFetchStreams: false (Crucial for Android WebViews/APK stability)
      firestoreInstance = initializeFirestore(appInstance, {
        experimentalForceLongPolling: true,
        experimentalAutoDetectLongPolling: false,
        useFetchStreams: false, 
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
          cacheSizeBytes: CACHE_SIZE_UNLIMITED
        })
      });

      console.log("ShopyKart Engine: Ultra-Reliable Connection Active ✅");

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
