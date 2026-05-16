'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, firestore: null, auth: null };
  }

  const config = firebaseConfig;

  try {
    let firebaseApp: FirebaseApp;
    
    if (!getApps().length) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = getApp();
    }

    const firestore = getFirestore(firebaseApp);
    const auth = getAuth(firebaseApp);

    return { firebaseApp, firestore, auth };
  } catch (error) {
    // Silently handle init errors to prevent app crash
    return { firebaseApp: null, firestore: null, auth: null };
  }
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
