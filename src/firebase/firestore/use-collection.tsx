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
 * @fileOverview ULTRA-FAST Cache-First Hook.
 * Uses sessionStorage to provide instant data while Firestore syncs in the background.
 */
export function useCollection<T = DocumentData>(query: Query<T> | null, cacheKey?: string) {
  const [data, setData] = useState<T[] | null>(() => {
    if (typeof window === 'undefined' || !cacheKey) return null;
    const cached = sessionStorage.getItem(`fire_cache_${cacheKey}`);
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<FirestoreError | null>(null);
  const isInitialSync = useRef(true);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      setData(null);
      return;
    }

    // Performance: removed includeMetadataChanges for raw speed
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
        
        // Update Cache for next visit
        if (cacheKey && typeof window !== 'undefined') {
          sessionStorage.setItem(`fire_cache_${cacheKey}`, JSON.stringify(items));
        }
      },
      async (err: FirestoreError) => {
        const silentCodes = ['unavailable', 'failed-precondition', 'deadline-exceeded', 'cancelled', 'resource-exhausted', 'internal', 'permission-denied'];
        
        if (err.code === 'permission-denied') {
          const segments = (query as any)._query?.path?.segments;
          const permissionError = new FirestorePermissionError({
            path: segments ? segments.join('/') : 'unknown',
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
        } else if (!silentCodes.includes(err.code)) {
          setError(err);
        }
        
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query, cacheKey]);

  return { data, loading, error };
}

export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  return useMemo(factory, deps);
}
