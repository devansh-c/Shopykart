'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
 * @fileOverview High-Performance Document Hook with Instant Cache Access.
 * Prevents Next.js Hydration Mismatches by strictly aligning server and initial client state.
 */
export function useDoc<T = DocumentData>(ref: DocumentReference<T> | null, cacheKey?: string, initialData?: T) {
  // 1. Initialize strictly with SSR data or Cache
  const [data, setData] = useState<T | null>(() => {
    if (initialData) return initialData;
    
    if (typeof window !== 'undefined' && cacheKey) {
      try {
        const cached = localStorage.getItem(`fire_doc_cache_${cacheKey}`);
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return null;
  });

  const [loading, setLoading] = useState(() => !initialData && !data && !!ref);
  const [error, setError] = useState<FirestoreError | null>(null);
  const refPath = ref?.path;

  useEffect(() => {
    if (!ref) {
      setLoading(false);
      setData(null);
      return;
    }

    const unsubscribe = onSnapshot(
      ref,
      { includeMetadataChanges: false },
      (snapshot: DocumentSnapshot<T>) => {
        const docData = snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } as T : null;
        setData(docData);
        setLoading(false);
        setError(null);

        // Update Cache for instant subsequent loads
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
  }, [refPath, cacheKey]);

  return { data, loading, error };
}
