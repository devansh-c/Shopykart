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
 * @fileOverview High-speed hook to fetch a single document with Cache-First logic.
 * Improved to handle 'resource-exhausted' (Quota) errors gracefully.
 */
export function useDoc<T = DocumentData>(ref: DocumentReference<T> | null, cacheKey?: string) {
  const [data, setData] = useState<T | null>(() => {
    if (typeof window === 'undefined' || !cacheKey) return null;
    try {
      const cached = sessionStorage.getItem(`fire_doc_cache_${cacheKey}`);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(!data && !!ref);
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

        if (cacheKey && typeof window !== 'undefined' && docData) {
          try {
            sessionStorage.setItem(`fire_doc_cache_${cacheKey}`, JSON.stringify(docData));
          } catch (e) {
            console.debug(`Quota exceeded for doc cache: ${cacheKey}`);
          }
        }
      },
      async (err: FirestoreError) => {
        // Handle Quota/Permission issues silently if possible
        if (err.code === 'resource-exhausted') {
          console.debug("Firestore Doc Quota Exceeded.");
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
  }, [ref, cacheKey]);

  return { data, loading, error };
}
