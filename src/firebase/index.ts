
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

    if (getApps().length > 0) {
      // App already exists, return existing instances
      firebaseApp = getApp();
      firestore = getFirestore(firebaseApp);
      auth = getAuth(firebaseApp);
    } else {
      // First time initialization
      firebaseApp = initializeApp(firebaseConfig);
      
      // We initialize with custom settings only once
      firestore = initializeFirestore(firebaseApp, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
        experimentalAutoDetectLongPolling: true,
      });
      
      auth = getAuth(firebaseApp);
    }

    return { firebaseApp, firestore, auth };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    // Fallback to basic getters if initialization logic fails
    try {
      const app = getApp();
      return { 
        firebaseApp: app, 
        firestore: getFirestore(app), 
        auth: getAuth(app) 
      };
    } catch (e) {
      return { firebaseApp: null, firestore: null, auth: null };
    }
  }
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
