"use client"

import { useState, useEffect, useMemo, useRef } from 'react';
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
 * @fileOverview High-Performance Document Hook.
 * REACTIVE FIX: Resets loading state when the reference path changes.
 */
export function useDoc<T = DocumentData>(ref: DocumentReference<T> | null, cacheKey?: string, initialData?: T) {
  const [data, setData] = useState<T | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData && !!ref);
  const [error, setError] = useState<FirestoreError | null>(null);
  const hasMounted = useRef(false);
  const refPath = ref?.path;

  // Handle Ref Changes
  useEffect(() => {
    if (hasMounted.current && ref) {
      setLoading(true);
    }
  }, [refPath]);

  // Cache lookup after mount
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      if (cacheKey && !data) {
        try {
          const cached = localStorage.getItem(`fire_doc_cache_${cacheKey}`);
          if (cached) {
            setData(JSON.parse(cached));
            setLoading(false);
          }
        } catch (e) {}
      }
    }
  }, [cacheKey, data]);

  useEffect(() => {
    if (!ref) {
      setLoading(false);
      setData(null);
      return;
    }

    const unsubscribe = onSnapshot(
      ref,
      { includeMetadataChanges: false },
      (snapshot: DocumentSnapshot<T>) => {
        const rawData = snapshot.data();
        if (!snapshot.exists() || !rawData) {
          setData(null);
          setLoading(false);
          return;
        }

        const cleanData = JSON.parse(JSON.stringify(rawData, (key, value) => {
          if (value && typeof value === 'object' && value.seconds !== undefined) {
            return new Date(value.seconds * 1000).toISOString();
          }
          return value;
        }));

        const docData = { ...cleanData, id: snapshot.id } as T;
        setData(docData);
        setLoading(false);
        setError(null);

        if (cacheKey && typeof window !== 'undefined' && docData) {
          try {
            localStorage.setItem(`fire_doc_cache_${cacheKey}`, JSON.stringify(docData));
          } catch (e: any) {}
        }
      },
      async (err: FirestoreError) => {
        const silentCodes = ['resource-exhausted', 'quota-exceeded', 'unavailable'];
        if (silentCodes.some(code => err.code?.includes(code) || err.message?.toLowerCase().includes('quota'))) {
          setLoading(false);
          return;
        }

        if (err.code === 'permission-denied') {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: ref.path,
            operation: 'get',
          }));
        }
        
        const quietCodes = ['unavailable', 'failed-precondition', 'deadline-exceeded', 'cancelled'];
        if (!quietCodes.includes(err.code)) {
          setError(err);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [refPath, cacheKey]);

  return { data, loading, error };
}
