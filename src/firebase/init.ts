
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
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
 * Uses persistent cache and FORCED long-polling to prevent [code=unavailable] errors
 * especially in environments with restricted WebSocket access.
 */
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, firestore: null, auth: null };
  }

  if (!appInstance) {
    try {
      appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      authInstance = getAuth(appInstance);
      
      // Ensure local persistence for a snappy auth feel
      setPersistence(authInstance, browserLocalPersistence).catch((err) => {
        console.warn("Auth persistence error:", err);
      });

      // CRITICAL: Force Long Polling to bypass WebSocket blocks which cause [code=unavailable]
      firestoreInstance = initializeFirestore(appInstance, {
        experimentalForceLongPolling: true,
        experimentalAutoDetectLongPolling: false, // Force it strictly
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });

    } catch (error) {
      console.error("Firebase initialization failed:", error);
      if (appInstance && !firestoreInstance) {
        firestoreInstance = getFirestore(appInstance);
      }
    }
  }

  return { 
    firebaseApp: appInstance, 
    firestore: firestoreInstance, 
    auth: authInstance 
  };
}
