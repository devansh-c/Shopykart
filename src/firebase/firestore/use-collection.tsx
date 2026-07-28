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
 * @fileOverview ULTRA-FAST Instant-Initialize Hook.
 * Initializes state synchronously from sessionStorage to prevent initial null frames.
 */
export function useCollection<T = DocumentData>(query: Query<T> | null, cacheKey?: string) {
  // ATOMIC SYNCHRONOUS INITIALIZATION: 
  // We read from cache DURING state initialization, not in useEffect.
  const [data, setData] = useState<T[] | null>(() => {
    if (typeof window === 'undefined' || !cacheKey) return null;
    try {
      const cached = sessionStorage.getItem(`fire_cache_${cacheKey}`);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  
  // If we have cached data, we set loading to false immediately
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
          } catch (e) {}
        }
      },
      async (err: FirestoreError) => {
        if (err.code === 'permission-denied') {
          const segments = (query as any)._query?.path?.segments;
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: segments ? segments.join('/') : 'unknown',
            operation: 'list',
          }));
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query, cacheKey]);

  return { data, loading, error };
}

export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  return useMemo(factory, deps);
}
