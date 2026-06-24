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
 * @fileOverview ULTRA-RESILIENT hook to fetch collections.
 * Optimized for INSTANT updates: Prefers server state while showing cache.
 */
export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(!!query);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      setData(null);
      return;
    }

    setLoading(true);
    
    // Aggressive snapshot listener to bridge the cache-server gap
    const unsubscribe = onSnapshot(
      query,
      { includeMetadataChanges: true }, 
      (snapshot: QuerySnapshot<T>) => {
        const items = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        }));
        
        // Immediate data update
        setData(items);
        
        // If snapshot is from server, we definitely have the latest state.
        // If from cache, we only stay in loading if we have NO data yet.
        const isFromCache = snapshot.metadata.fromCache;
        if (!isFromCache || items.length > 0) {
           setLoading(false);
        }
        
        setError(null);
      },
      async (err: FirestoreError) => {
        // Suppress expected transient network errors to prevent UI blocking
        const silentCodes = ['unavailable', 'failed-precondition', 'deadline-exceeded', 'cancelled', 'resource-exhausted', 'internal'];
        
        if (err.code === 'permission-denied') {
          const segments = (query as any)._query?.path?.segments;
          const permissionError = new FirestorePermissionError({
            path: segments ? segments.join('/') : 'unknown',
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
          setLoading(false);
          return;
        }
        
        if (silentCodes.includes(err.code)) {
          console.debug(`Firestore Sync (Wait...): [${err.code}]`);
          return;
        }

        setError(err);
        setLoading(false);
        console.error("Firestore Error:", err.code, err.message);
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, loading, error };
}

export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  return useMemo(factory, deps);
}
