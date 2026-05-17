
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
      // For firestore, we try to get existing instance or use a try-catch to initialize if needed
      try {
        firestore = getFirestore(firebaseApp);
      } catch (e) {
        firestore = initializeFirestore(firebaseApp, {
          localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
          experimentalAutoDetectLongPolling: true,
        });
      }
    } else {
      // First time initialization
      firebaseApp = initializeApp(firebaseConfig);
      firestore = initializeFirestore(firebaseApp, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
        experimentalAutoDetectLongPolling: true,
      });
      auth = getAuth(firebaseApp);
    }

    return { firebaseApp, firestore, auth };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    try {
      const app = getApp() || initializeApp(firebaseConfig);
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
