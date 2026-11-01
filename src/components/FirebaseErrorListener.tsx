'use client';

import { useEffect, useRef } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * @fileOverview Global Firebase Error Listener.
 * Aggressively silences Connectivity, Timeout and Quota errors to prevent visual interruptions.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();
  const lastErrorRef = useRef<string>('');

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // AGGRESSIVE SILENCE: Suppress all timeout and connectivity warnings
      const silentMessages = [
        'unavailable', 
        'deadline-exceeded', 
        'reach cloud firestore backend',
        'backend didn\'t respond',
        'offline mode',
        'failed-precondition',
        'quota-exceeded',
        'resource-exhausted',
        'quota exceeded',
        'limit exceeded',
        'network'
      ];
      
      const errorMessage = error.message?.toLowerCase() || '';
      const errorCode = (error as any).code || '';

      const isSilentWarning = silentMessages.some(m => 
        errorMessage.includes(m) || 
        errorCode === 'unavailable' || 
        errorCode === 'deadline-exceeded' ||
        errorCode === 'resource-exhausted' ||
        errorCode === 'quota-exceeded'
      );

      if (isSilentWarning) {
        console.debug('Firestore connectivity notice silenced:', errorMessage);
        return;
      }

      if (error.context?.path && lastErrorRef.current !== error.context.path) {
        lastErrorRef.current = error.context.path;
        
        // SUPPRESS NOISY PATHS
        const noisyPaths = ['/orders', '/users', '/products', '/banners', '/categories', '/vendors', '/app_settings'];
        const isNoisy = noisyPaths.some(p => error.context?.path.includes(p));

        if (!isNoisy) {
          toast({
            variant: 'destructive',
            title: 'Identity Alert',
            description: `Access restricted. Check your login status.`,
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
