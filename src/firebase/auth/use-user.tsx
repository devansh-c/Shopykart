
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

    // Set initial loading based on whether we think we have a session
    const maybeActive = typeof window !== 'undefined' && localStorage.getItem('shopykart_session_active') === 'true';
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // SYNC SESSION FLAG: Critical for preventing login popups on reload
        if (typeof window !== 'undefined') {
          localStorage.setItem('shopykart_session_active', 'true');
        }
      } else {
        setUser(null);
        // We only clear the flag if Firebase definitely confirms no user is logged in
        if (typeof window !== 'undefined') {
          // Keep the flag during short disconnects/reloads to avoid flicker
          // localStorage.removeItem('shopykart_session_active');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  return { user, loading };
}
