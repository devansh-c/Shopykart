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
 * @fileOverview OMNI-INSTANT Hook v13.
 * Optimized for TRUE 0-second loading using Aggressive Synchronous Initializer.
 * Prioritizes SSR Data > LocalStorage Cache to eliminate any visual delay for Crawlers and Incognito.
 */
export function useCollection<T = DocumentData>(query: Query<T> | null, cacheKey?: string, initialData?: T[]) {
  // 1. Synchronous Initialization: Immediate state injection from SSR or Cache
  const [data, setData] = useState<T[] | null>(() => {
    // A. Priority 1: SSR Props (Critical for Googlebot and Incognito)
    if (initialData && initialData.length > 0) return initialData;
    
    // B. Priority 2: Persistent LocalStorage Cache
    if (typeof window !== 'undefined' && cacheKey) {
      try {
        const cached = localStorage.getItem(`fire_cache_${cacheKey}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return null;
  });
  
  // Loading is strictly false if data is already present from SSR or cache
  const [loading, setLoading] = useState(() => !data);
  const [error, setError] = useState<FirestoreError | null>(null);
  
  const queryStr = query ? JSON.stringify((query as any)._query || {}) : '';

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    // 2. Real-time Background Sync
    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot<T>) => {
        const items = snapshot.docs.map(doc => {
          const rawData = doc.data();
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
        
        // Update LocalStorage silently for next visit
        if (cacheKey && typeof window !== 'undefined') {
          try {
            localStorage.setItem(`fire_cache_${cacheKey}`, JSON.stringify(items));
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
