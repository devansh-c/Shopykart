'use client';

import { useState, useEffect } from 'react';
import { 
  DocumentReference, 
  onSnapshot, 
  DocumentSnapshot, 
  DocumentData,
  FirestoreError
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

/**
 * @fileOverview Resilient hook to fetch a single document with high-priority server sync.
 */
export function useDoc<T = DocumentData>(ref: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!ref);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!ref) {
      setLoading(false);
      setData(null);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      ref,
      { includeMetadataChanges: true },
      (snapshot: DocumentSnapshot<T>) => {
        setData(snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } as T : null);
        
        // If data is from server, we are definitely not loading.
        // If from cache, we only stop loading if it's the first available data.
        if (!snapshot.metadata.fromCache || snapshot.exists()) {
          setLoading(false);
        }
        
        setError(null);
      },
      async (err: FirestoreError) => {
        // Suppress expected network-related errors
        const quietCodes = ['unavailable', 'failed-precondition', 'deadline-exceeded', 'cancelled', 'resource-exhausted'];

        if (err.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: ref.path,
            operation: 'get',
          });
          errorEmitter.emit('permission-error', permissionError);
        }
        
        if (!quietCodes.includes(err.code)) {
          setError(err);
          setLoading(false);
        } else {
          console.debug(`Firestore Doc Sync (Auto-retrying...): [${err.code}]`);
        }
      }
    );

    return () => unsubscribe();
  }, [ref]);

  return { data, loading, error };
}
