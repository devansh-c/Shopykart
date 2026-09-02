
'use client';

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '../provider';

/**
 * @fileOverview Optimized hook for real Firebase Auth with persistent session support.
 * Aggressively syncs localStorage flag to prevent unnecessary login popups.
 */
export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // SYNC SESSION FLAG: Critical for preventing login popups on reload
        if (typeof window !== 'undefined') {
          localStorage.setItem('shopykart_session_active', 'true');
        }
      } else {
        setUser(null);
        // Do NOT clear shopykart_session_active immediately to prevent hydration flickering
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  return { user, loading };
}
