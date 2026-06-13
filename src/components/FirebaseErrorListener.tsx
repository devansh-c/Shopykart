
'use client';

import { useEffect, useRef } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();
  const lastErrorRef = useRef<string>('');

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // Use console.debug to completely suppress Next.js Dev Red Screen for known errors
      console.debug('Firebase Notice:', {
        path: error.context.path,
        operation: error.context.operation,
      });

      // Show toast notification only for important path restrictions
      if (lastErrorRef.current !== error.context.path) {
        lastErrorRef.current = error.context.path;
        
        // Critical permissions can still show toasts, but silent for background sync errors
        if (!error.context.path.includes('/products')) {
          toast({
            variant: 'destructive',
            title: 'Sync Alert',
            description: `Some data might be temporarily unavailable at ${error.context.path}.`,
          });
        }

        // Reset the ref after 10 seconds to avoid spamming
        setTimeout(() => {
          lastErrorRef.current = '';
        }, 10000);
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);
  }, [toast]);

  return null;
}
