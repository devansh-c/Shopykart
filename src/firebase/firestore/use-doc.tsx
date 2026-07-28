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
 * Added try-catch for storage quota protection.
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

        // Update Cache with Quota check
        if (cacheKey && typeof window !== 'undefined' && docData) {
          try {
            sessionStorage.setItem(`fire_doc_cache_${cacheKey}`, JSON.stringify(docData));
          } catch (e) {
            console.debug(`Quota exceeded for doc cache: ${cacheKey}`);
          }
        }
      },
      async (err: FirestoreError) => {
        const quietCodes = ['unavailable', 'failed-precondition', 'deadline-exceeded', 'cancelled', 'resource-exhausted', 'permission-denied'];

        if (err.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: ref.path,
            operation: 'get',
          });
          errorEmitter.emit('permission-error', permissionError);
        }
        
        if (!quietCodes.includes(err.code)) {
          setError(err);
          setLoading(false);
        } else {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [ref, cacheKey]);

  return { data, loading, error };
}
