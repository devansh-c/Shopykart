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
 * Optimized for 3G/4G/5G and WebViews (APKs).
 */
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, firestore: null, auth: null };
  }

  if (!appInstance) {
    try {
      appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      
      authInstance = getAuth(appInstance);
      setPersistence(authInstance, browserLocalPersistence).catch((err) => {
        console.warn("Auth persistence error:", err);
      });

      setLogLevel('silent');

      // ULTRA-RELIABLE 3G/SLOW NETWORK SETTINGS
      firestoreInstance = initializeFirestore(appInstance, {
        experimentalForceLongPolling: true, // Crucial for 3G/4G stability
        experimentalAutoDetectLongPolling: false, 
        useFetchStreams: false, // Better compatibility with older Android WebViews
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
