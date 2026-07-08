'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { firebaseConfig } from './config';

let appInstance: FirebaseApp | null = null;
let firestoreInstance: any = null;
let authInstance: any = null;

/**
 * Optimized Firebase initialization singleton.
 * Uses dynamic requires to prevent Node-only modules (like gRPC) from leaking into SSR.
 */
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return { firebaseApp: null, firestore: null, auth: null };
  }

  // AGGRESSIVE CONSOLE SUPPRESSION
  if (!(window as any)._fs_suppressed) {
    (window as any)._fs_suppressed = true;
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const msg = args.join(' ');
      if (msg.includes('firestore') || msg.includes('quota') || msg.includes('network')) return;
      originalConsoleError.apply(console, args);
    };
  }

  if (!appInstance) {
    try {
      appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      
      // Dynamic imports for browser-only SDKs to avoid SSR gRPC issues
      const { 
        initializeFirestore, 
        persistentLocalCache, 
        CACHE_SIZE_UNLIMITED,
        persistentMultipleTabManager 
      } = require('firebase/firestore');
      
      const { 
        getAuth, 
        setPersistence, 
        browserLocalPersistence 
      } = require('firebase/auth');

      authInstance = getAuth(appInstance);
      setPersistence(authInstance, browserLocalPersistence).catch(() => {});

      firestoreInstance = initializeFirestore(appInstance, {
        localCache: persistentLocalCache({
          cacheSizeBytes: CACHE_SIZE_UNLIMITED,
          tabManager: persistentMultipleTabManager()
        }),
        experimentalForceLongPolling: true,
      });

      console.log("ShopyKart Engine: Client Ready ✅");
    } catch (error) {
      console.error("Firebase init failed:", error);
    }
  }

  return { 
    firebaseApp: appInstance, 
    firestore: firestoreInstance, 
    auth: authInstance 
  };
}
