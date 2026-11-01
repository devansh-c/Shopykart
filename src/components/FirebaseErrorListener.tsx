'use client';

import { useEffect, useRef } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * @fileOverview Global Firebase Error Listener.
 * Aggressively silences Quota and Connectivity errors to prevent visual Red Screen interruptions.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();
  const lastErrorRef = useRef<string>('');

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // SILENT DEBUG: Do not throw to prevent Red Screen
      console.debug('Firestore Notification:', {
        path: error.context?.path,
        operation: error.context?.operation,
        message: error.message
      });

      // AGGRESSIVE SILENCE: Suppress all quota and connectivity warnings
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
        'limit exceeded'
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
        return;
      }

      if (error.context?.path && lastErrorRef.current !== error.context.path) {
        lastErrorRef.current = error.context.path;
        
        // SUPPRESS NOISY PATHS: Don't show toast for high-sync internal collections
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
