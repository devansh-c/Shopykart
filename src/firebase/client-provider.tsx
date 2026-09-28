'use client';

import React, { ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './init';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * @fileOverview Optimized Firebase Client Provider.
 * Consistent rendering between Server and Client to prevent Hydration errors.
 */
export default function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [instances, setInstances] = useState<{
    firebaseApp: any;
    firestore: any;
    auth: any;
  } | null>(null);

  useEffect(() => {
    // Initialize ONLY on client mount
    setInstances(initializeFirebase());
  }, []);

  // During SSR and first client render, instances is null.
  // We still render the Provider to keep the tree structure identical for React hydration.
  return (
    <FirebaseProvider 
      firebaseApp={instances?.firebaseApp || null} 
      firestore={instances?.firestore || null} 
      auth={instances?.auth || null}
    >
      {children}
    </FirebaseProvider>
  );
}
