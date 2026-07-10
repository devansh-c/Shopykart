
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

  if (!appInstance) {
    try {
      appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      
      authInstance = getAuth(appInstance);
      setPersistence(authInstance, browserLocalPersistence).catch(() => {});

      // Use initializeFirestore with Long Polling to fix "Could not reach backend" error
      // in constrained network/proxy environments.
      firestoreInstance = initializeFirestore(appInstance, {
        experimentalForceLongPolling: true,
      });

      console.log("ShopyKart Engine: Connection Secured ✅");
    } catch (error) {
      console.error("Firebase init failed:", error);
      if (appInstance) {
        firestoreInstance = getFirestore(appInstance);
        authInstance = getAuth(appInstance);
      }
    }
  }

  return { 
    firebaseApp: appInstance, 
    firestore: firestoreInstance, 
    auth: authInstance 
  };
}
