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
 * @fileOverview Hydration-Safe useDoc Hook.
 * Defers localStorage access to useEffect to prevent Next.js client-side exceptions.
 */
export function useDoc<T = DocumentData>(ref: DocumentReference<T> | null, cacheKey?: string, initialData?: T) {
  // 1. Initialize strictly with SSR data to match server render
  const [data, setData] = useState<T | null>(initialData || null);
  const [loading, setLoading] = useState(() => !initialData && !!ref);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    // 2. Client-only: Load from cache if SSR data is missing
    if (!data && cacheKey && typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`fire_doc_cache_${cacheKey}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed) {
            setData(parsed);
            setLoading(false);
          }
        }
      } catch (e) {
        console.debug("Doc cache read failed:", e);
      }
    }

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
