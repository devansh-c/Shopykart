'use client';

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { firebaseConfig } from './config';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';

let appInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

/**
 * Robust Firebase initialization singleton for Next.js.
 * Ensures instances are created once and reused consistently across HMR.
 */
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, firestore: null, auth: null };
  }

  try {
    // 1. App Instance - Using safer array access for HMR compatibility
    if (!appInstance) {
      const apps = getApps();
      appInstance = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
    }

    // 2. Auth Instance
    if (!authInstance && appInstance) {
      authInstance = getAuth(appInstance);
      // Non-blocking persistence setting
      setPersistence(authInstance, browserLocalPersistence).catch(() => {});
    }

    // 3. Firestore Instance
    if (!firestoreInstance && appInstance) {
      firestoreInstance = getFirestore(appInstance);
    }
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }

  return { 
    firebaseApp: appInstance, 
    firestore: firestoreInstance, 
    auth: authInstance 
  };
}
