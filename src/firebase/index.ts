
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * Robust Firebase initialization to prevent "initializeFirestore() has already been called" errors.
 * Ensures custom options are applied only during the first initialization.
 */
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, firestore: null, auth: null };
  }

  try {
    let firebaseApp: FirebaseApp;
    let firestore: Firestore;
    let auth: Auth;

    // Check if app already exists
    if (getApps().length > 0) {
      firebaseApp = getApp();
      auth = getAuth(firebaseApp);
      // For firestore, we try to get existing instance safely
      try {
        firestore = getFirestore(firebaseApp);
      } catch (e) {
        // If not initialized with settings, we attempt a clean init if possible
        // but usually getFirestore() works if app exists.
        firestore = getFirestore(firebaseApp);
      }
    } else {
      // First time initialization
      firebaseApp = initializeApp(firebaseConfig);
      // We initialize without persistent cache if it causes multi-tab lock issues in studio
      firestore = getFirestore(firebaseApp);
      auth = getAuth(firebaseApp);
    }

    return { firebaseApp, firestore, auth };
  } catch (error) {
    console.error('Firebase initialization error:', error);
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
