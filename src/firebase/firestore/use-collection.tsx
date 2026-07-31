'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
 * @fileOverview OMNI-INSTANT Hook v6.
 * Optimized for TRUE 0-second loading using Synchronous LocalStorage Initializer.
 * Prevents "deer mein dikhna" by injecting data before the first render completes.
 */
export function useCollection<T = DocumentData>(query: Query<T> | null, cacheKey?: string, initialData?: T[]) {
  // 1. Synchronous Initialization: Pre-render data injection
  const [data, setData] = useState<T[] | null>(() => {
    // A. Priority 1: SSR Props (If available and not empty)
    if (initialData && initialData.length > 0) return initialData;
    
    // B. Priority 2: Persistent LocalStorage Cache (Instant fallback)
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
  
  const [loading, setLoading] = useState(() => !data);
  const [error, setError] = useState<FirestoreError | null>(null);
  
  const queryStr = query ? JSON.stringify((query as any)._query || {}) : '';
  const isFirstSync = useRef(true);

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
          // Ensure plain objects only
          const cleanData = JSON.parse(JSON.stringify(rawData));
          return {
            ...cleanData,
            id: doc.id,
          };
        });
        
        setData(items as T[]);
        setLoading(false);
        setError(null);
        
        // Update Cache silently
        if (cacheKey && typeof window !== 'undefined') {
          try {
            localStorage.setItem(`fire_cache_${cacheKey}`, JSON.stringify(items));
          } catch (e) {}
        }
        isFirstSync.current = false;
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
