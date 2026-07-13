'use client';

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
 * Ensures instances are created once and reused consistently across the client.
 */
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, firestore: null, auth: null };
  }

  try {
    // Check if an app is already initialized
    if (getApps().length === 0) {
      appInstance = initializeApp(firebaseConfig);
    } else {
      appInstance = getApp();
    }

    if (appInstance) {
      // Lazy initialize services only if they don't exist
      if (!authInstance) {
        authInstance = getAuth(appInstance);
        // Set persistence to local to handle page refreshes seamlessly
        setPersistence(authInstance, browserLocalPersistence).catch(() => {});
      }

      if (!firestoreInstance) {
        firestoreInstance = getFirestore(appInstance);
      }
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
