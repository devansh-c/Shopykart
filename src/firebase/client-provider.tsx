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
 * Replaced default spinner with SplashScreen for a seamless initial boot.
 */
export default function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isReady, setIsReady] = useState(false);
  
  // Memoize instances to ensure they are stable across refreshes
  const instances = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return initializeFirebase();
  }, []);

  useEffect(() => {
    // Immediate ready state to allow SplashScreen to handle the exit transition
    setIsReady(true);
  }, []);

  // Show the luxury Splash Screen instead of the red spinner during initial boot
  if (!isReady || !instances || !instances.firebaseApp) {
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
