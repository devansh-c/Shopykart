import { initializeApp, getApps, FirebaseApp, getApp } from 'firebase/app';
import { firebaseConfig } from './config';
import { initializeFirestore, persistentLocalCache, Firestore, memoryLocalCache } from 'firebase/firestore';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';

/**
 * Singleton instances to prevent multiple initializations during HMR.
 */
let appInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

/**
 * Optimized Firebase initialization for Mobile/Static Export.
 * FAIL-SAFE INIT: Switches to memory cache if persistent storage is locked.
 */
export function initializeFirebase() {
  // 1. Initialize App
  if (getApps().length === 0) {
    appInstance = initializeApp(firebaseConfig);
  } else {
    appInstance = getApp();
  }

  // 2. Initialize Firestore with Fail-Safe Persistence
  if (!firestoreInstance) {
    if (typeof window !== 'undefined') {
      try {
        firestoreInstance = initializeFirestore(appInstance, {
          localCache: persistentLocalCache({
            tabManager: undefined 
          }),
        });
      } catch (e) {
        console.warn("Firebase Persistence failed, falling back to memory.");
        firestoreInstance = initializeFirestore(appInstance, {
          localCache: memoryLocalCache()
        });
      }
    } else {
      firestoreInstance = initializeFirestore(appInstance, {
        localCache: memoryLocalCache()
      });
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