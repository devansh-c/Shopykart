import { initializeApp, getApps, FirebaseApp, getApp } from 'firebase/app';
import { firebaseConfig } from './config';
import { initializeFirestore, persistentLocalCache, Firestore } from 'firebase/firestore';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';

/**
 * Singleton instances to prevent multiple initializations during HMR.
 */
let appInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

/**
 * Optimized Firebase initialization for Mobile/Static Export.
 * Uses persistentLocalCache and explicit browserLocalPersistence to fix login loss.
 */
export function initializeFirebase() {
  // 1. Initialize App
  if (getApps().length === 0) {
    appInstance = initializeApp(firebaseConfig);
  } else {
    appInstance = getApp();
  }

  // 2. Initialize Firestore with Persistent Local Cache
  if (!firestoreInstance) {
    if (typeof window !== 'undefined') {
      firestoreInstance = initializeFirestore(appInstance, {
        localCache: persistentLocalCache({
          tabManager: undefined // Best for Mobile/Single-tab environments
        }),
      });
    } else {
      const { getFirestore } = require('firebase/firestore');
      firestoreInstance = getFirestore(appInstance);
    }
  }

  // 3. Initialize Auth with Browser Local Persistence
  if (!authInstance) {
    authInstance = getAuth(appInstance);
    if (typeof window !== 'undefined') {
      // Explicitly set persistence to LOCAL to survive app restarts
      setPersistence(authInstance, browserLocalPersistence).catch((err) => {
        console.error("Auth Persistence Error:", err);
      });
    }
  }

  return { 
    firebaseApp: appInstance, 
    firestore: firestoreInstance, 
    auth: authInstance 
  };
}
