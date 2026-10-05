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
 * Optimized for Instant Hydration from localStorage and stable snapshot listeners.
 */
export function useCollection<T = DocumentData>(query: Query<T> | null, cacheKey?: string, initialData?: T[]) {
  // 1. ATOMIC INITIALIZATION: Try to get data from cache before first render
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

  const [loading, setLoading] = useState(() => !data && !!query);
  const [error, setError] = useState<FirestoreError | null>(null);
  
  // Ref to track query hash to prevent unnecessary listener resets
  const lastQueryKeyRef = useRef<string>('');

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    // Creating a stable key for the current query
    const queryKey = (query as any)._query?.path?.segments?.join('/') || 'root';
    
    // 2. Real-time Background Sync
    const unsubscribe = onSnapshot(
      query,
      { includeMetadataChanges: false },
      (snapshot: QuerySnapshot<T>) => {
        const items = snapshot.docs.map(doc => {
          const rawData = doc.data();
          // Fast normalization for dates
          const cleanData = { ...rawData };
          Object.keys(cleanData).forEach(key => {
            const val = (cleanData as any)[key];
            if (val && typeof val === 'object' && val.seconds !== undefined) {
              (cleanData as any)[key] = new Date(val.seconds * 1000).toISOString();
            }
          });
          
          return {
            ...cleanData,
            id: doc.id,
          };
        });
        
        setData(items as T[]);
        setLoading(false);
        setError(null);
        
        // Persist to local storage for instant load on next visit
        if (cacheKey && typeof window !== 'undefined') {
          try {
            localStorage.setItem(`fire_cache_${cacheKey}`, JSON.stringify(items));
          } catch (e: any) {}
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
  }, [query ? JSON.stringify((query as any)._query || {}) : '', cacheKey]);

  return { data, loading, error };
}

export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  return useMemo(factory, deps);
}