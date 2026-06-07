
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
 * Optimized Firebase initialization singleton.
 * Optimized for peak efficiency and memory usage.
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

      // PEAK PERFORMANCE SETTINGS
      firestoreInstance = initializeFirestore(appInstance, {
        experimentalAutoDetectLongPolling: true,
        useFetchStreams: true, 
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
          cacheSizeBytes: CACHE_SIZE_UNLIMITED
        })
      });

      console.log("ShopyKart Turbo Engine: Active ✅");

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
