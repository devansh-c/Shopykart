'use client';

import { initializeApp, getApps, FirebaseApp, getApp } from 'firebase/app';
import { firebaseConfig } from './config';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';

let appInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

/**
 * Robust Firebase initialization singleton for Next.js.
 * Ensures instances are created once and reused consistently.
 */
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, firestore: null, auth: null };
  }

  try {
    if (getApps().length === 0) {
      appInstance = initializeApp(firebaseConfig);
    } else {
      appInstance = getApp();
    }

    if (!authInstance && appInstance) {
      authInstance = getAuth(appInstance);
      setPersistence(authInstance, browserLocalPersistence).catch(() => {});
    }

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
