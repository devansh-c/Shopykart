'use client';

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '../provider';

/**
 * @fileOverview Optimized hook for real Firebase Auth with persistent session support.
 * Automatically syncs localStorage flag to help persistence guards across refreshes.
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
        // SYNC SESSION FLAG: Ensure persistence guards (Vendor/Delivery) know we are logged in
        if (typeof window !== 'undefined') {
          localStorage.setItem('shopykart_session_active', 'true');
        }
      } else {
        setUser(null);
        // We don't clear the flag here to prevent flicker during slow network auth reconnections
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  return { user, loading };
}
