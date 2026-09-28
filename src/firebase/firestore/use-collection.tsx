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
 * @fileOverview High-Performance Real-time Collection Hook.
 * Optimized for Instant Hydration from localStorage.
 */
export function useCollection<T = DocumentData>(query: Query<T> | null, cacheKey?: string, initialData?: T[]) {
  // 1. ATOMIC INITIALIZATION: Try to get data from cache or props before first render
  const [data, setData] = useState<T[] | null>(() => {
    if (initialData && initialData.length > 0) return initialData;
    
    if (typeof window !== 'undefined' && cacheKey) {
      try {
        const cached = localStorage.getItem(`fire_cache_${cacheKey}`);
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return null;
  });

  // Loading is only true if we have absolutely NO data to show
  const [loading, setLoading] = useState(() => !data && !!query);
  const [error, setError] = useState<FirestoreError | null>(null);
  
  const queryStr = useMemo(() => query ? JSON.stringify((query as any)._query || {}) : '', [query]);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    // 2. Real-time Background Sync
    const unsubscribe = onSnapshot(
      query,
      { includeMetadataChanges: false },
      (snapshot: QuerySnapshot<T>) => {
        const items = snapshot.docs.map(doc => {
          const rawData = doc.data();
          // Normalize timestamps to strings for consistent serializability
          const cleanData = JSON.parse(JSON.stringify(rawData, (key, value) => {
            if (value && typeof value === 'object' && value.seconds !== undefined) {
              return new Date(value.seconds * 1000).toISOString();
            }
            return value;
          }));
          
          return {
            ...cleanData,
            id: doc.id,
          };
        });
        
        setData(items as T[]);
        setLoading(false);
        setError(null);
        
        if (cacheKey && typeof window !== 'undefined') {
          try {
            localStorage.setItem(`fire_cache_${cacheKey}`, JSON.stringify(items));
          } catch (e: any) {
            if (e.name === 'QuotaExceededError') {
               console.warn("Cache Quota Full");
            }
          }
        }
      },
      (err: FirestoreError) => {
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
