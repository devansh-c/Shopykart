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
 * @fileOverview OMNI-INSTANT Hook v5.
 * Optimized for TRUE 0-second loading using Synchronous LocalStorage Initializer.
 * Strictly plain-objects only for Next.js compatibility.
 */
export function useCollection<T = DocumentData>(query: Query<T> | null, cacheKey?: string, initialData?: T[]) {
  // 1. Synchronous Initialization: Immediate read from Cache or Props
  // This executes during the very first render cycle.
  const [data, setData] = useState<T[] | null>(() => {
    // Priority 1: SSR Props (Authentic & Fresh)
    if (initialData && initialData.length > 0) return initialData;
    
    // Priority 2: LocalStorage Cache (Instant)
    if (typeof window !== 'undefined' && cacheKey) {
      try {
        const cached = localStorage.getItem(`fire_cache_${cacheKey}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          return Array.isArray(parsed) ? parsed : null;
        }
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  
  // loading is false if we have any source of truth available synchronously
  const [loading, setLoading] = useState(() => !data);
  const [error, setError] = useState<FirestoreError | null>(null);
  
  const queryStr = query ? JSON.stringify((query as any)._query || {}) : '';

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    // 2. Background Sync: Silent update from Firestore
    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot<T>) => {
        // Plain object conversion
        const items = snapshot.docs.map(doc => {
          const rawData = doc.data();
          const cleanData = JSON.parse(JSON.stringify(rawData));
          return {
            ...cleanData,
            id: doc.id,
          };
        });
        
        setData(items as T[]);
        setLoading(false);
        setError(null);
        
        // Persistent Cache update
        if (cacheKey && typeof window !== 'undefined') {
          try {
            localStorage.setItem(`fire_cache_${cacheKey}`, JSON.stringify(items));
          } catch (e) {}
        }
      },
      async (err: FirestoreError) => {
        // Silent Fail: Keep showing cached/SSR data on network issues
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
