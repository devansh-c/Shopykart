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

      // REAL-TIME PRIORITY INITIALIZATION
      // ForceLongPolling is still kept for environment compatibility but 
      // Multi-Tab manager is enabled for better cross-tab status syncing.
      firestoreInstance = initializeFirestore(appInstance, {
        localCache: persistentLocalCache({
          cacheSizeBytes: CACHE_SIZE_UNLIMITED,
          tabManager: persistentMultipleTabManager()
        }),
        experimentalForceLongPolling: true,
      });

      // Global suppression for specific sync warnings to prevent UI blocking
      const originalConsoleError = console.error;
      console.error = (...args) => {
        const message = args[0]?.toString() || '';
        if (message.includes('@firebase/firestore')) {
          if (message.includes('Could not reach Cloud') || message.includes('Backend didn\'t respond')) {
            console.debug("Background Syncing:", message);
            return;
          }
        }
        originalConsoleError.apply(console, args);
      };

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
