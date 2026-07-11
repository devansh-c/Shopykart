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
 * @fileOverview High-speed hook to fetch a single document with optimized caching.
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
    // Performance: removed includeMetadataChanges for faster initial response
    const unsubscribe = onSnapshot(
      ref,
      (snapshot: DocumentSnapshot<T>) => {
        setData(snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } as T : null);
        setLoading(false);
        setError(null);
      },
      async (err: FirestoreError) => {
        const quietCodes = ['unavailable', 'failed-precondition', 'deadline-exceeded', 'cancelled', 'resource-exhausted', 'permission-denied'];

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
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [ref]);

  return { data, loading, error };
}
