'use client';

import React, { ReactNode, useEffect, useState, useMemo } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './init';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * Ensures Firebase is only initialized once in the browser.
 * Prevents hydration errors and instance mismatch crashes.
 */
export default function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isReady, setIsReady] = useState(false);
  
  // Memoize instances to ensure they are stable across renders
  const instances = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return initializeFirebase();
  }, []);

  useEffect(() => {
    setIsReady(true);
  }, []);

  // Avoid rendering until client-side hydration is complete
  if (!isReady || !instances) {
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
