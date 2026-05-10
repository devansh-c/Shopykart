
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
    app: FirebaseApp;
    firestore: Firestore;
    auth: Auth;
  } | null>(null);

  useEffect(() => {
    // Initialize Firebase only on the client
    setInstances(initializeFirebase());
  }, []);

  // During SSR or before hydration, instances will be null.
  // The provider handles null values gracefully via its context.
  return (
    <FirebaseProvider 
      firebaseApp={instances?.app as any} 
      firestore={instances?.firestore as any} 
      auth={instances?.auth as any}
    >
      {children}
    </FirebaseProvider>
  );
}
