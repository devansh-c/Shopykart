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
 * Configured for MAXIMUM SPEED AND STABILITY.
 * Added aggressive console suppression to prevent Next.js Error Overlay for transient connection issues.
 */
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, firestore: null, auth: null };
  }

  // AGGRESSIVE CONSOLE SUPPRESSION (Top Level)
  if (!window.hasOwnProperty('_fs_suppressed')) {
    (window as any)._fs_suppressed = true;
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args[0]?.toString() || '';
      // Intercept Firestore backend connection warnings
      if (message.includes('@firebase/firestore') && (message.includes('Could not reach Cloud') || message.includes('Backend didn\'t respond'))) {
        console.debug("Firestore Background Syncing...");
        return;
      }
      originalConsoleError.apply(console, args);
    };
  }

  if (!appInstance) {
    try {
      appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      
      authInstance = getAuth(appInstance);
      setPersistence(authInstance, browserLocalPersistence).catch((err) => {
        console.warn("Auth persistence error:", err);
      });

      // REAL-TIME PRIORITY INITIALIZATION
      // experimentalForceLongPolling is crucial for restricted cloud environments
      firestoreInstance = initializeFirestore(appInstance, {
        localCache: persistentLocalCache({
          cacheSizeBytes: CACHE_SIZE_UNLIMITED,
          tabManager: persistentMultipleTabManager()
        }),
        experimentalForceLongPolling: true,
      });

      console.log("ShopyKart Real-Time Engine: Active ✅");

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
