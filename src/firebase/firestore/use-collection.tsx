'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Query, 
  onSnapshot, 
  QuerySnapshot, 
  DocumentData,
  FirestoreError
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

/**
 * @fileOverview ULTRA-FAST Instant-Initialize Hook with Quota Protection.
 * Initializes state synchronously from sessionStorage to prevent initial null frames.
 * Gracefully handles 'resource-exhausted' (Quota Exceeded) errors.
 */
export function useCollection<T = DocumentData>(query: Query<T> | null, cacheKey?: string) {
  // ATOMIC SYNCHRONOUS INITIALIZATION: 
  // We read from cache DURING state initialization to prevent blank states.
  const [data, setData] = useState<T[] | null>(() => {
    if (typeof window === 'undefined' || !cacheKey) return null;
    try {
      const cached = sessionStorage.getItem(`fire_cache_${cacheKey}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        return Array.isArray(parsed) ? parsed : null;
      }
      return null;
    } catch (e) {
      return null;
    }
  });
  
  const [loading, setLoading] = useState(() => !data);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      setData(null);
      return;
    }

    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot<T>) => {
        const items = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        }));
        
        setData(items as T[]);
        setLoading(false);
        setError(null);
        
        if (cacheKey && typeof window !== 'undefined') {
          try {
            sessionStorage.setItem(`fire_cache_${cacheKey}`, JSON.stringify(items));
          } catch (e) {
            console.debug(`Quota exceeded for session storage: ${cacheKey}`);
          }
        }
      },
      async (err: FirestoreError) => {
        // QUOTA PROTECTION: Handle 'resource-exhausted' silently if we have cached data
        if (err.code === 'resource-exhausted') {
          console.warn("Firestore Quota Exceeded. Serving from local cache.");
          setLoading(false);
          // If we have data from cache, don't show an error
          if (!data) setError(err);
          return;
        }

        if (err.code === 'permission-denied') {
          const segments = (query as any)._query?.path?.segments;
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: segments ? segments.join('/') : 'unknown',
            operation: 'list',
          }));
        }
        
        setLoading(false);
        setError(err);
      }
    );

    return () => unsubscribe();
  }, [query, cacheKey, data]);

  return { data, loading, error };
}

export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  return useMemo(factory, deps);
}
