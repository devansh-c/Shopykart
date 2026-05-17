'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * Robust Firebase initialization to prevent "initializeFirestore() has already been called" errors.
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
      auth = getAuth(firebaseApp);
      firestore = getFirestore(firebaseApp);
    } else {
      firebaseApp = initializeApp(firebaseConfig);
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
