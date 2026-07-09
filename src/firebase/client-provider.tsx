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
 * @fileOverview High-reliability Firebase Provider for client-side environments.
 * Prevents "Expected first argument..." errors by ensuring instances are ready.
 */
export default function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [instances, setInstances] = useState<{
    firebaseApp: FirebaseApp | null;
    firestore: Firestore | null;
    auth: Auth | null;
  } | null>(null);

  useEffect(() => {
    // Initialization happens ONLY once the component is mounted in the browser.
    const results = initializeFirebase();
    setInstances(results);
  }, []);

  return (
    <FirebaseProvider 
      firebaseApp={instances?.firebaseApp || null} 
      firestore={instances?.firestore || null} 
      auth={instances?.auth || null}
    >
      {/* 
        CRITICAL: Only render children when instances are fully hydrated. 
        This prevents 'null' firestore from leaking into hooks during the very first render,
        avoiding the "Expected first argument to collection()..." crash.
      */}
      {instances ? children : null}
    </FirebaseProvider>
  );
}
