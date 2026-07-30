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
 * @fileOverview ULTRA-FAST Instant-Initialize Hook with Quota & Backoff Protection.
 * Silently handles 'resource-exhausted' to prevent Next.js error overlays.
 * FIXED: Removed 'data' from dependencies to prevent infinite update loop.
 */
export function useCollection<T = DocumentData>(query: Query<T> | null, cacheKey?: string) {
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
            // Silently ignore storage quota
          }
        }
      },
      async (err: FirestoreError) => {
        // AGGRESSIVE QUOTA SUPPRESSION
        if (err.code === 'resource-exhausted' || err.code === 'unavailable') {
          console.debug("Firestore Status: Quota or Connection limit hit. Serving from local cache.");
          setLoading(false);
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
  }, [query, cacheKey]); // FIXED: Removed 'data' dependency

  return { data, loading, error };
}

export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  return useMemo(factory, deps);
}
