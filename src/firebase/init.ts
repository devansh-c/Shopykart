'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { firebaseConfig } from './config';
import { 
  initializeFirestore, 
  Firestore,
  getFirestore
} from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence, Auth } from 'firebase/auth';

let appInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

/**
 * Optimized Firebase initialization singleton.
 * SSR Safe: Only runs on the client.
 */
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, firestore: null, auth: null };
  }

  // 1. Initialize or Get Firebase App
  if (!appInstance) {
    try {
      appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    } catch (error) {
      console.error("Firebase App initialization failed:", error);
    }
  }

  if (!appInstance) {
    return { firebaseApp: null, firestore: null, auth: null };
  }

  // 2. Initialize or Get Auth Instance
  if (!authInstance) {
    try {
      authInstance = getAuth(appInstance);
      setPersistence(authInstance, browserLocalPersistence).catch(() => {});
    } catch (error) {
      console.error("Firebase Auth initialization failed:", error);
    }
  }

  // 3. Initialize or Get Firestore Instance
  if (!firestoreInstance) {
    try {
      // Performance: Removed experimentalForceLongPolling for standard environments to use faster WebSockets/GRPC
      firestoreInstance = getFirestore(appInstance);
    } catch (error) {
      firestoreInstance = getFirestore(appInstance);
    }
  }

  return { 
    firebaseApp: appInstance, 
    firestore: firestoreInstance, 
    auth: authInstance 
  };
}
