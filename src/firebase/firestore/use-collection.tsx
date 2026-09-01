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
 * @fileOverview High-Performance Real-time Collection Hook.
 * Implements aggressive localStorage caching for "0-second" delay loads.
 * Quota-Aware: Safely handles full storage errors.
 */
export function useCollection<T = DocumentData>(query: Query<T> | null, cacheKey?: string, initialData?: T[]) {
  // 1. Initialize strictly with SSR data or Cache to match server render and avoid pop-in
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

  const [loading, setLoading] = useState(() => !initialData && !data);
  const [error, setError] = useState<FirestoreError | null>(null);
  
  // Use a ref for the query string to avoid re-running effect on every render
  const queryStr = useMemo(() => query ? JSON.stringify((query as any)._query || {}) : '', [query]);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    // 2. Real-time Background Sync with High-Speed Hydration
    const unsubscribe = onSnapshot(
      query,
      { includeMetadataChanges: false },
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
        
        // Update Cache for subsequent instant loads - DEFENSIVELY
        if (cacheKey && typeof window !== 'undefined') {
          try {
            localStorage.setItem(`fire_cache_${cacheKey}`, JSON.stringify(items));
          } catch (e: any) {
            // Silently fail caching if storage is full
            if (e.name === 'QuotaExceededError') {
               console.warn("Firestore Cache skipped: localStorage quota exceeded.");
            }
          }
        }
      },
      async (err: FirestoreError) => {
        // Suppress noisy network errors during transitions
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
