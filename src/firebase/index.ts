'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  initializeFirestore, 
  Firestore, 
  enableIndexedDbPersistence, 
  CACHE_SIZE_UNLIMITED 
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, firestore: null, auth: null };
  }

  try {
    let firebaseApp: FirebaseApp;
    
    if (!getApps().length) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApp();
    }

    // Using initializeFirestore with custom settings to handle network timeouts in virtual environments
    const firestore = initializeFirestore(firebaseApp, {
      experimentalForceLongPolling: true,
      cacheSizeBytes: CACHE_SIZE_UNLIMITED
    });
    
    const auth = getAuth(firebaseApp);

    // Persistence is handled asynchronously to prevent blocking initialization
    if (typeof window !== 'undefined') {
      enableIndexedDbPersistence(firestore).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Firestore Persistence: Multiple tabs open, using memory cache.');
        } else if (err.code === 'unimplemented') {
          console.warn('Firestore Persistence: Browser not supported.');
        }
      });
    }

    return { firebaseApp, firestore, auth };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return { firebaseApp: null, firestore: null, auth: null };
  }
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
