'use client';

import React, { ReactNode, useEffect, useState, useMemo } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './init';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * Ensures Firebase is only initialized once in the browser environment.
 * Optimized initialization for near-instant boot without Splash Screen.
 */
export default function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isReady, setIsReady] = useState(false);
  
  const instances = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return initializeFirebase();
  }, []);

  useEffect(() => {
    if (instances?.firebaseApp) {
      setIsReady(true);
    }
  }, [instances]);

  // If SSR or Firebase not ready yet, return null (handled by Next.js hydration)
  if (typeof window === 'undefined' || !isReady || !instances) {
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
