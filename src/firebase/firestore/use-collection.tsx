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
 * Optimized for INSTANT updates and reliable loading states.
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
    
    // Fail-safe: Force loading to false if no response in 2.5 seconds
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 2500);
    
    const unsubscribe = onSnapshot(
      query,
      { includeMetadataChanges: true }, 
      (snapshot: QuerySnapshot<T>) => {
        clearTimeout(timeout);
        const items = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        }));
        
        setData(items as T[]);
        setLoading(false);
        setError(null);
      },
      async (err: FirestoreError) => {
        clearTimeout(timeout);
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

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [query]);

  return { data, loading, error };
}

export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  return useMemo(factory, deps);
}
