
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
 * @fileOverview Resilient hook to fetch collections with enhanced offline error suppression.
 */
export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!query) {
      return;
    }

    setLoading(true);
    
    // Using a more resilient snapshot listener with silent failure for connection warnings
    const unsubscribe = onSnapshot(
      query,
      { includeMetadataChanges: true }, // Essential for smooth offline/online transitions
      (snapshot: QuerySnapshot<T>) => {
        const items = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        }));
        setData(items);
        setLoading(false);
        setError(null); // Clear error on success
      },
      async (err: FirestoreError) => {
        // Handle permission errors globally
        if (err.code === 'permission-denied') {
          const segments = (query as any)._query?.path?.segments;
          const permissionError = new FirestorePermissionError({
            path: segments ? segments.join('/') : 'unknown',
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
        }
        
        // SUPPRESS RED SCREENS: 'unavailable' and 'failed-precondition' are common
        // in prototype/web environments when local persistence or network is jittery.
        if (err.code !== 'unavailable' && err.code !== 'failed-precondition') {
          setError(err);
        } else {
          console.warn('Firestore Collection Fetch: Offline or cache sync in progress.');
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
