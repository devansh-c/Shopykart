
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, firestore: null, auth: null };
  }

  // Robust check for API key to prevent SDK crashes
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === '') {
    console.warn("Firebase configuration is missing or invalid. Authentication features will be disabled until a valid API key is set in environment variables.");
    return { firebaseApp: null, firestore: null, auth: null };
  }

  let firebaseApp: FirebaseApp;
  
  try {
    if (!getApps().length) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApp();
    }

    const firestore = getFirestore(firebaseApp);
    const auth = getAuth(firebaseApp);

    return { firebaseApp, firestore, auth };
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    return { firebaseApp: null, firestore: null, auth: null };
  }
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
