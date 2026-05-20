'use client';

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '../provider';

/**
 * @fileOverview Enhanced hook that supports both Firebase Auth and Guest sessions.
 */
export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check for standard Firebase Auth
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setLoading(false);
      } else {
        // 2. Fallback: Check for Guest Session in LocalStorage
        const guestId = typeof window !== 'undefined' ? localStorage.getItem('guest_uid') : null;
        if (guestId) {
          // Provide a virtual user object that matches the minimal Firebase User interface
          setUser({
            uid: guestId,
            isAnonymous: true,
            displayName: localStorage.getItem('guest_name') || 'Guest'
          } as any);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  return { user, loading };
}
