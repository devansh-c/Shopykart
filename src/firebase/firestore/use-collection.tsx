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
 * Optimized for real-time sync: Forces server data priority while showing cache for speed.
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
    
    // Snappier snapshot listener with aggressive server sync
    const unsubscribe = onSnapshot(
      query,
      { includeMetadataChanges: true }, 
      (snapshot: QuerySnapshot<T>) => {
        const items = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        }));
        
        setData(items);
        
        // CRITICAL: We only stop 'loading' when data is NOT from cache 
        // OR if it's from cache but we have a baseline to show.
        // This ensures the first load with cache doesn't prevent the server update from rendering.
        if (!snapshot.metadata.fromCache || (snapshot.metadata.fromCache && items.length > 0)) {
           setLoading(false);
        }
        
        setError(null);
      },
      async (err: FirestoreError) => {
        if (err.code === 'permission-denied') {
          const segments = (query as any)._query?.path?.segments;
          const permissionError = new FirestorePermissionError({
            path: segments ? segments.join('/') : 'unknown',
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
        }
        
        // SUPPRESS SLOW NETWORK ERRORS but log them for debugging
        const suppressedCodes = ['unavailable', 'failed-precondition', 'deadline-exceeded', 'cancelled', 'resource-exhausted'];
        
        if (!suppressedCodes.includes(err.code)) {
          setError(err);
        } else {
          console.debug(`Firestore Sync (Wait): [${err.code}]. Data will update when online.`);
        }
        
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, loading, error };
}

export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  return useMemo(factory, deps);
}
