'use client';

import React, { ReactNode, useEffect, useState } from 'react';
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
 * Prevents hydration errors and "Firestore instance is null" crashes.
 */
export default function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [instances, setInstances] = useState<{
    firebaseApp: FirebaseApp | null;
    firestore: Firestore | null;
    auth: Auth | null;
  } | null>(null);

  useEffect(() => {
    // Immediate initialization on mount
    const results = initializeFirebase();
    setInstances(results);
  }, []);

  // Standard Next.js pattern: Don't render until client-side state is ready
  if (!instances) {
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
