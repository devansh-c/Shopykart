'use client';

import { useState, useEffect } from 'react';
import { 
  DocumentReference, 
  onSnapshot, 
  DocumentSnapshot, 
  DocumentData,
  FirestoreError
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

/**
 * @fileOverview Resilient single-doc fetch hook with Synchronous LocalStorage caching and SSR Support.
 * Optimized for 0-second loading by reading from initialData or cache during state initialization.
 */
export function useDoc<T = DocumentData>(ref: DocumentReference<T> | null, cacheKey?: string, initialData?: T) {
  // 1. Aggressive Synchronous Initialization: SSR Data > Cache > Null
  const [data, setData] = useState<T | null>(() => {
    if (initialData) return initialData;
    if (typeof window === 'undefined' || !cacheKey) return null;
    try {
      const cached = localStorage.getItem(`fire_doc_cache_${cacheKey}`);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });

  // Loading is only true if we have ABSOLUTELY no data (cached or otherwise)
  const [loading, setLoading] = useState(() => !data && !!ref);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!ref) {
      setLoading(false);
      setData(null);
      return;
    }

    const unsubscribe = onSnapshot(
      ref,
      (snapshot: DocumentSnapshot<T>) => {
        const docData = snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } as T : null;
        setData(docData);
        setLoading(false);
        setError(null);

        // Update cache silently in background
        if (cacheKey && typeof window !== 'undefined' && docData) {
          try {
            localStorage.setItem(`fire_doc_cache_${cacheKey}`, JSON.stringify(docData));
          } catch (e) {}
        }
      },
      async (err: FirestoreError) => {
        if (err.code === 'resource-exhausted' || err.code === 'unavailable') {
          setLoading(false);
          return;
        }

        if (err.code === 'permission-denied') {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: ref.path,
            operation: 'get',
          }));
        }
        
        const quietCodes = ['unavailable', 'failed-precondition', 'deadline-exceeded', 'cancelled'];
        if (!quietCodes.includes(err.code)) {
          setError(err);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ref?.path, cacheKey]);

  return { data, loading, error };
}
