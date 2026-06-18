'use client';

import { initializeApp, getApps, getApp, FirebaseApp, setLogLevel } from 'firebase/app';
import { 
  Firestore, 
  initializeFirestore, 
  persistentLocalCache, 
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { firebaseConfig } from './config';

let appInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

/**
 * Optimized Firebase initialization singleton.
 * Using a more resilient cache strategy for mobile/webview environments.
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

      // SILENT LOGGING: Prevent internal connection warnings from showing up as UI Errors
      setLogLevel('silent');

      // RESILIENT FIRESTORE INITIALIZATION
      // experimentalAutoDetectLongPolling is critical for restrictive networks
      firestoreInstance = initializeFirestore(appInstance, {
        experimentalAutoDetectLongPolling: true,
        useFetchStreams: true, 
        localCache: persistentLocalCache({
          cacheSizeBytes: CACHE_SIZE_UNLIMITED
        })
      });

      // Global handler to catch any unhandled firestore background errors
      window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && event.reason.toString().includes('@firebase/firestore')) {
          event.preventDefault();
        }
      });

      console.log("ShopyKart Turbo Engine: Active & Resilient ✅");

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
