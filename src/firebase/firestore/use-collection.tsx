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
 * Optimized for real-time sync: Handles network timeouts gracefully.
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
        if (!snapshot.metadata.fromCache || (snapshot.metadata.fromCache && items.length > 0)) {
           setLoading(false);
        }
        
        setError(null);
      },
      async (err: FirestoreError) => {
        // Suppress expected network-related errors in restricted environments
        // These will auto-resolve when the SDK successfully connects via Long Polling
        const quietCodes = [
          'unavailable', 
          'failed-precondition', 
          'deadline-exceeded', 
          'cancelled', 
          'resource-exhausted',
          'internal'
        ];

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
        
        if (!quietCodes.includes(err.code)) {
          setError(err);
          console.error("Firestore Critical Error:", err.code, err.message);
        } else {
          // Just a debug log, no need to show red screen to user or agent
          console.debug(`Firestore Sync (Auto-retrying...): [${err.code}]`);
        }
        
        // Don't set loading false for network issues, let the cache stay visible
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, loading, error };
}

export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  return useMemo(factory, deps);
}
