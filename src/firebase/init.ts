'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, initializeFirestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * Robust Firebase initialization singleton.
 * Prevents circular dependencies by staying in its own file.
 */
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, firestore: null, auth: null };
  }

  try {
    let firebaseApp: FirebaseApp;
    let firestore: Firestore;
    let auth: Auth;

    if (getApps().length > 0) {
      firebaseApp = getApp();
    } else {
      firebaseApp = initializeApp(firebaseConfig);
    }

    auth = getAuth(firebaseApp);

    try {
      firestore = getFirestore(firebaseApp);
    } catch (e) {
      firestore = initializeFirestore(firebaseApp, {});
    }

    return { firebaseApp, firestore, auth };
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    return { firebaseApp: null, firestore: null, auth: null };
  }
}
