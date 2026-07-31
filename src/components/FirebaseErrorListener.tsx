'use client';

import { useEffect, useRef } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * @fileOverview Global Firebase Error Listener.
 * Strictly handles permission errors. Suppresses noisy backend connection warnings.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();
  const lastErrorRef = useRef<string>('');

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // SILENT DEBUG: Do not throw or log as error to prevent Next.js Red Screen
      console.debug('Firestore Notice:', {
        path: error.context.path,
        operation: error.context.operation,
      });

      if (lastErrorRef.current !== error.context.path) {
        lastErrorRef.current = error.context.path;
        
        // Show silent toast only for critical path restrictions, not background syncs
        if (!error.context.path.includes('/products') && !error.context.path.includes('/banners')) {
          toast({
            variant: 'destructive',
            title: 'Identity Alert',
            description: `Access restricted at ${error.context.path}. Please verify login.`,
          });
        }

        setTimeout(() => {
          lastErrorRef.current = '';
        }, 10000);
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);
  }, [toast]);

  return null;
}
