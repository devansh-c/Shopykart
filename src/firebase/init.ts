
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, initializeFirestore } from 'firebase/firestore';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
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
    
    // Set persistence explicitly to browserLocalPersistence for better stability on mobile
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn("Auth persistence could not be set:", err);
    });

    try {
      // CRITICAL FIX: Use experimentalForceLongPolling to prevent connectivity errors 
      // in restricted network environments or cloud IDEs (e.g., code=unavailable).
      firestore = initializeFirestore(firebaseApp, {
        experimentalForceLongPolling: true,
      });
    } catch (e) {
      // Fallback if initializeFirestore is already called elsewhere
      firestore = getFirestore(firebaseApp);
    }

    return { firebaseApp, firestore, auth };
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    return { firebaseApp: null, firestore: null, auth: null };
  }
}
