'use client';

import { useEffect, useRef } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * @fileOverview Global Firebase Error Listener.
 * Strictly handles permission errors. Suppresses noisy backend connection and quota warnings visually.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();
  const lastErrorRef = useRef<string>('');

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // SILENT DEBUG: Do not throw or log as error to prevent Next.js Red Screen
      console.debug('Firestore Notice:', {
        path: error.context?.path,
        operation: error.context?.operation,
      });

      // AGGRESSIVE SILENCE: Suppress all connectivity, timeout and quota warnings visually
      const silentMessages = [
        'unavailable', 
        'deadline-exceeded', 
        'reach cloud firestore backend',
        'backend didn\'t respond',
        'offline mode',
        'within 10 seconds',
        'failed-precondition',
        'quota-exceeded',
        'resource-exhausted',
        'quota exceeded'
      ];
      
      const errorMessage = error.message?.toLowerCase() || '';
      const errorCode = (error as any).code || '';

      const isSilentWarning = silentMessages.some(m => 
        errorMessage.includes(m) || 
        errorCode === 'unavailable' || 
        errorCode === 'deadline-exceeded' ||
        errorCode === 'resource-exhausted'
      );

      if (isSilentWarning) {
        return;
      }

      if (error.context?.path && lastErrorRef.current !== error.context.path) {
        lastErrorRef.current = error.context.path;
        
        // SUPPRESS NOISY PATHS: Don't show toast for sync-heavy collections
        const noisyPaths = ['/orders', '/users', '/products', '/banners', '/categories', '/vendors'];
        const isNoisy = noisyPaths.some(p => error.context?.path.includes(p));

        if (!isNoisy) {
          toast({
            variant: 'destructive',
            title: 'Identity Alert',
            description: `Access restricted. Please verify your account.`,
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
