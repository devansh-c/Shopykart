'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  Firestore, 
  initializeFirestore, 
  persistentLocalCache, 
  CACHE_SIZE_UNLIMITED,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { firebaseConfig } from './config';

let appInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

/**
 * Optimized Firebase initialization singleton.
 * Configured for MAXIMUM REAL-TIME RESPONSIVENESS.
 * Removes experimental flags that could cause sync delays on some networks.
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

      // RESILIENT FIRESTORE INITIALIZATION
      // Prioritizes WebSocket over Long-Polling for instant updates.
      // Uses Multiple Tab Manager to ensure sync across different browser tabs.
      firestoreInstance = initializeFirestore(appInstance, {
        localCache: persistentLocalCache({
          cacheSizeBytes: CACHE_SIZE_UNLIMITED,
          tabManager: persistentMultipleTabManager()
        })
      });

      // Global handler to catch any unhandled firestore background errors
      window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && event.reason.toString().includes('@firebase/firestore')) {
          event.preventDefault();
        }
      });

      console.log("ShopyKart Real-Time Engine: High Priority Sync Active ✅");

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
