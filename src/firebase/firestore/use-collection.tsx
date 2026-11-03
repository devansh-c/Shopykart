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
 * TWO-PASS RENDERING: Strictly prevents hydration errors by deferring cache until after mount.
 */
export function useCollection<T = DocumentData>(query: Query<T> | null, cacheKey?: string, initialData?: T[]) {
  // Always start with server-safe values (initialData or null) for the first render
  const [data, setData] = useState<T[] | null>(() => {
    if (initialData && initialData.length > 0) return initialData;
    return null;
  });
  const [loading, setLoading] = useState(() => !data && !!query);
  const [error, setError] = useState<FirestoreError | null>(null);
  
  const hasMounted = useRef(false);

  // Load from cache only after client-side hydration is complete
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      if (cacheKey && !data) {
        try {
          const cached = localStorage.getItem(`fire_cache_${cacheKey}`);
          if (cached) {
            setData(JSON.parse(cached));
            setLoading(false);
          }
        } catch (e) {}
      }
    }
  }, [cacheKey, data]);

  const stableQueryPath = useMemo(() => {
    if (!query) return '';
    try {
      return (query as any)._query?.path?.segments?.join('/') || Math.random().toString();
    } catch (e) {
      return Math.random().toString();
    }
  }, [query]);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      query,
      { includeMetadataChanges: false },
      (snapshot: QuerySnapshot<T>) => {
        const items = snapshot.docs.map(doc => {
          const rawData = doc.data();
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
        
        if (cacheKey && typeof window !== 'undefined') {
          try {
            localStorage.setItem(`fire_cache_${cacheKey}`, JSON.stringify(items));
          } catch (e: any) {}
        }
      },
      (err: FirestoreError) => {
        const silentCodes = ['resource-exhausted', 'quota-exceeded', 'unavailable', 'deadline-exceeded'];
        if (silentCodes.some(code => err.code?.includes(code) || err.message?.toLowerCase().includes('quota'))) {
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
  }, [stableQueryPath, cacheKey]);

  return { data, loading, error };
}

export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  return useMemo(factory, deps);
}
