
'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './index';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [instances, setInstances] = useState<{
    firebaseApp: FirebaseApp | null;
    firestore: Firestore | null;
    auth: Auth | null;
  } | null>(null);

  useEffect(() => {
    // Initialize Firebase only on the client
    const results = initializeFirebase();
    setInstances(results as any);
  }, []);

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
