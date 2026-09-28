'use client';

import React, { ReactNode, useMemo } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './init';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * @fileOverview Optimized Firebase Client Provider.
 * Removed 'isReady' state blocking to allow immediate access to Firebase instances on frame 1.
 */
export default function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const instances = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return initializeFirebase();
  }, []);

  // Return null ONLY during SSR to prevent hydration mismatch.
  // On the client, it starts rendering children IMMEDIATELY with available instances.
  if (typeof window === 'undefined' || !instances) {
    return null;
  }

  return (
    <FirebaseProvider 
      firebaseApp={instances.firebaseApp} 
      firestore={instances.firestore} 
      auth={instances.auth}
    >
      {children}
    </FirebaseProvider>
  );
}
