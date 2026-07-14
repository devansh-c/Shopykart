'use client';

import React, { ReactNode, useEffect, useState, useMemo } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './init';
import { SplashScreen } from '@/components/shared/SplashScreen';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * Ensures Firebase is only initialized once in the browser environment.
 * Optimized initialization for near-instant boot.
 */
export default function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isReady, setIsReady] = useState(false);
  
  // Initialize instances immediately on client side
  const instances = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return initializeFirebase();
  }, []);

  useEffect(() => {
    // Check if Firebase is initialized successfully
    // Empty dependency array ensures this hook never changes size or order
    if (instances?.firebaseApp) {
      setIsReady(true);
    }
  }, [instances]);

  // If SSR or Firebase not ready yet, show Splash
  if (typeof window === 'undefined' || !isReady || !instances) {
    return <SplashScreen isAppReady={false} />;
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
