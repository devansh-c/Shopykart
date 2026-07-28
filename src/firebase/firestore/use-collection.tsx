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
 * Optimized with QuotaExceeded checks to prevent crashes with large datasets.
 */
export function useCollection<T = DocumentData>(query: Query<T> | null, cacheKey?: string) {
  const [data, setData] = useState<T[] | null>(() => {
    if (typeof window === 'undefined' || !cacheKey) return null;
    try {
      const cached = sessionStorage.getItem(`fire_cache_${cacheKey}`);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      console.debug("Cache read failed:", e);
      return null;
    }
  });
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<FirestoreError | null>(null);

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
        
        // Update Cache for next visit with Quota protection
        if (cacheKey && typeof window !== 'undefined') {
          try {
            sessionStorage.setItem(`fire_cache_${cacheKey}`, JSON.stringify(items));
          } catch (e) {
            // If storage is full (common with 1000 items + base64), fail silently
            console.debug(`SessionStorage Quota Exceeded for ${cacheKey}. Proceeding without local cache.`);
          }
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
