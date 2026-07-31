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
 * @fileOverview OMNI-INSTANT Hook.
 * Optimized for zero-latency paint by initializing state synchronously.
 * Strictly uses authentic data from SSR props or sessionStorage cache.
 */
export function useCollection<T = DocumentData>(query: Query<T> | null, cacheKey?: string, initialData?: T[]) {
  // 1. Synchronous Initialization
  const [data, setData] = useState<T[] | null>(() => {
    // Priority 1: Authentic SSR Data (Instant Paint)
    if (initialData && initialData.length > 0) return initialData;
    
    // Priority 2: Authentic Session Cache (Instant Recovery)
    if (typeof window === 'undefined' || !cacheKey) return null;
    try {
      const cached = sessionStorage.getItem(`fire_cache_${cacheKey}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        return Array.isArray(parsed) ? parsed : null;
      }
    } catch (e) {
      return null;
    }
    return null;
  });
  
  // CRITICAL: Loading is FALSE immediately if we have any authentic data
  const [loading, setLoading] = useState(() => !data);
  const [error, setError] = useState<FirestoreError | null>(null);
  
  const queryStr = query ? JSON.stringify((query as any)._query || {}) : '';

  useEffect(() => {
    if (!query) {
      setLoading(false);
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
        const silentCodes = ['resource-exhausted', 'unavailable', 'deadline-exceeded', 'cancelled'];
        if (silentCodes.includes(err.code)) {
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
  }, [queryStr, cacheKey]);

  return { data, loading, error };
}

export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  return useMemo(factory, deps);
}
