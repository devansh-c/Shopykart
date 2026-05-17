
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, initializeFirestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * Enhanced Firebase initialization to be extremely robust in Next.js Dev/Turbopack.
 * Checks for existing instances before creating new ones to avoid setting-conflict errors.
 */
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, firestore: null, auth: null };
  }

  try {
    let firebaseApp: FirebaseApp;
    let firestore: Firestore;
    let auth: Auth;

    // Initialize App
    if (getApps().length > 0) {
      firebaseApp = getApp();
    } else {
      firebaseApp = initializeApp(firebaseConfig);
    }

    // Initialize Auth
    auth = getAuth(firebaseApp);

    // Initialize Firestore safely
    try {
      // Try getting existing firestore instance first
      firestore = getFirestore(firebaseApp);
    } catch (e) {
      // If fails, use standard initialization
      firestore = initializeFirestore(firebaseApp, {});
    }

    return { firebaseApp, firestore, auth };
  } catch (error) {
    // Ultimate fallback to existing app
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
