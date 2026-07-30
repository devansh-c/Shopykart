import { initializeApp, getApps, FirebaseApp, getApp } from 'firebase/app';
import { firebaseConfig } from './config';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';

/**
 * Singleton instances to prevent multiple initializations during HMR.
 */
let appInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

/**
 * Robust Firebase initialization singleton for Next.js.
 * Environment-aware: Works on both Server (SSR) and Client.
 */
export function initializeFirebase() {
  // 1. Initialize App
  if (getApps().length === 0) {
    appInstance = initializeApp(firebaseConfig);
  } else {
    appInstance = getApp();
  }

  // 2. Initialize Firestore
  if (!firestoreInstance) {
    firestoreInstance = getFirestore(appInstance);
  }

  // 3. Initialize Auth (Persistence only on client)
  if (!authInstance) {
    authInstance = getAuth(appInstance);
    
    // Only set browser persistence if we are in a browser environment
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
