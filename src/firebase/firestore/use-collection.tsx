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
 * Optimized for slow internet: Prioritizes local cache so UI feels instant.
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
    
    // Snappier snapshot listener with cache-first behavior
    const unsubscribe = onSnapshot(
      query,
      { includeMetadataChanges: true }, 
      (snapshot: QuerySnapshot<T>) => {
        const items = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        }));
        
        setData(items);
        
        // Only stop loading if the data is "fresh" from server OR we have cached data to show
        // snapshot.metadata.fromCache tells us if data is from local storage
        if (!snapshot.metadata.hasPendingWrites) {
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
        
        // SUPPRESS SLOW NETWORK ERRORS
        const suppressedCodes = ['unavailable', 'failed-precondition', 'deadline-exceeded', 'cancelled', 'resource-exhausted'];
        
        if (!suppressedCodes.includes(err.code)) {
          setError(err);
        } else {
          console.debug(`Firestore Sync (Slow Network): [${err.code}]. Using local data.`);
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