'use client';

import { useEffect, useRef } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * @fileOverview Global Firebase Error Listener.
 * Strictly handles permission errors. Suppresses noisy backend connection warnings and network glitches.
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

      // AGGRESSIVE SILENCE: Suppress all connectivity, timeout and reachability warnings
      const silentMessages = [
        'unavailable', 
        'deadline-exceeded', 
        'reach cloud firestore backend',
        'backend didn\'t respond',
        'offline mode',
        'within 10 seconds',
        'failed-precondition'
      ];
      
      const isSilentWarning = silentMessages.some(m => 
        error.message?.toLowerCase().includes(m) || 
        (error as any).code === 'unavailable' || 
        (error as any).code === 'deadline-exceeded'
      );

      if (isSilentWarning) {
        return;
      }

      if (lastErrorRef.current !== error.context.path) {
        lastErrorRef.current = error.context.path;
        
        // SUPPRESS NOISY PATHS: Don't show toast for sync-heavy collections
        const noisyPaths = ['/orders', '/users', '/products', '/banners', '/categories'];
        const isNoisy = noisyPaths.some(p => error.context.path.includes(p));

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
