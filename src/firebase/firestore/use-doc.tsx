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
 * @fileOverview Resilient hook to fetch a single document with offline-graceful handling.
 * Ensures the app doesn't crash when Firestore reports offline status.
 */
export function useDoc<T = DocumentData>(ref: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    // Keep loading if ref is not available yet
    if (!ref) {
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      ref,
      { includeMetadataChanges: true },
      (snapshot: DocumentSnapshot<T>) => {
        setData(snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } as T : null);
        setLoading(false);
        setError(null);
      },
      async (err: FirestoreError) => {
        if (err.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: ref.path,
            operation: 'get',
          });
          errorEmitter.emit('permission-error', permissionError);
        }
        
        // SILENT OFFLINE ERROR: Do not trigger a Red Screen for temporary backend connection issues.
        const suppressedCodes = ['unavailable', 'failed-precondition', 'deadline-exceeded', 'cancelled', 'resource-exhausted'];
        
        if (!suppressedCodes.includes(err.code)) {
          setError(err);
        } else {
          console.debug(`Firestore Doc Sync Notice: [${err.code}] Using local cache due to slow connection.`);
        }
        
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ref]);

  return { data, loading, error };
}
