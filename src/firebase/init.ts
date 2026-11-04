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
 * Removed Multi-Tab Manager to prevent deadlocks in Android WebViews.
 */
export function initializeFirebase() {
  // 1. Initialize App
  if (getApps().length === 0) {
    appInstance = initializeApp(firebaseConfig);
  } else {
    appInstance = getApp();
  }

  // 2. Initialize Firestore with Lite Persistence
  if (!firestoreInstance) {
    if (typeof window !== 'undefined') {
      firestoreInstance = initializeFirestore(appInstance, {
        localCache: persistentLocalCache({}), // Simplified cache for single-tab WebView
        experimentalForceLongPolling: true 
      });
    } else {
      const { getFirestore } = require('firebase/firestore');
      firestoreInstance = getFirestore(appInstance);
    }
  }

  // 3. Initialize Auth
  if (!authInstance) {
    authInstance = getAuth(appInstance);
    if (typeof window !== 'undefined') {
      setPersistence(authInstance, browserLocalPersistence).catch(() => {});
    }
  }

  return { 
    firebaseApp: appInstance, 
    firestore: firestoreInstance, 
    auth: authInstance 
  };
}
