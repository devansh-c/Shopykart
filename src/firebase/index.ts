'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, initializeFirestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * Robust Firebase initialization singleton.
 * Prevents "Firestore already initialized" errors during Next.js Hot Reloading.
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
      // Use existing firestore instance if possible
      firestore = getFirestore(firebaseApp);
    } catch (e) {
      // Standard initialization fallback
      firestore = initializeFirestore(firebaseApp, {});
    }

    return { firebaseApp, firestore, auth };
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    return { 
      firebaseApp: app, 
      firestore: getFirestore(app), 
      auth: getAuth(app) 
    };
  }
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
