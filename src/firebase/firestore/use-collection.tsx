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
 * @fileOverview OMNI-INSTANT Hook v4.
 * Optimized for 0-second loading using LocalStorage Caching.
 * Synchronously initializes state from Cache/Props to eliminate all render blinks.
 */
export function useCollection<T = DocumentData>(query: Query<T> | null, cacheKey?: string, initialData?: T[]) {
  // 1. Synchronous Initialization: Read from SSR Props OR LocalStorage IMMEDIATELY
  const [data, setData] = useState<T[] | null>(() => {
    // Priority 1: Authentic SSR Data (Fresh from Server)
    if (initialData && initialData.length > 0) return initialData;
    
    // Priority 2: Persistent LocalStorage Cache (For 0-second startup)
    if (typeof window === 'undefined' || !cacheKey) return null;
    try {
      const cached = localStorage.getItem(`fire_cache_${cacheKey}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        return Array.isArray(parsed) ? parsed : null;
      }
    } catch (e) {
      return null;
    }
    return null;
  });
  
  // CRITICAL: Loading is FALSE immediately if we have any data (cached or SSR)
  const [loading, setLoading] = useState(() => !data);
  const [error, setError] = useState<FirestoreError | null>(null);
  
  const queryStr = query ? JSON.stringify((query as any)._query || {}) : '';

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    // 2. Background Sync: Fetch live data silently and update state/cache
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
        
        // Update LocalStorage for next app open
        if (cacheKey && typeof window !== 'undefined') {
          try {
            localStorage.setItem(`fire_cache_${cacheKey}`, JSON.stringify(items));
          } catch (e) {
            console.warn("Storage quota exceeded, caching skipped.");
          }
        }
      },
      async (err: FirestoreError) => {
        // Silent Fail for connectivity issues to keep showing cached data
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
