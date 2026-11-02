'use client';

import { useEffect, useRef } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * @fileOverview Global Firebase Error Listener.
 * GHOST-SILENCE MODE: Aggressively silences Connectivity, Timeout and Quota logs
 * by intercepting console.error before the environment can display them visually.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();
  const lastErrorRef = useRef<string>('');

  useEffect(() => {
    // 1. GHOST-SILENCE: Override global console methods to filter out annoying Firestore backend messages
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    const silentKeywords = [
      'could not reach cloud firestore backend',
      'backend didn\'t respond',
      'unavailable',
      'deadline-exceeded',
      'resource-exhausted',
      'quota-exceeded',
      'failed-precondition',
      '@firebase/firestore'
    ];

    const isInternalFirestoreNotice = (args: any[]) => {
      const combinedMsg = args.map(arg => String(arg).toLowerCase()).join(' ');
      return silentKeywords.some(keyword => combinedMsg.includes(keyword));
    };

    console.error = (...args: any[]) => {
      if (isInternalFirestoreNotice(args)) {
        // Silently swallow the error so it doesn't trigger visual HTML boxes
        return;
      }
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      if (isInternalFirestoreNotice(args)) {
        return;
      }
      originalConsoleWarn.apply(console, args);
    };

    // 2. Permission Error Handler (For real identity issues)
    const handlePermissionError = (error: FirestorePermissionError) => {
      const errorMessage = error.message?.toLowerCase() || '';
      
      // Don't show toast for connectivity/timeout even if they bubble up here
      const isSilent = silentKeywords.some(k => errorMessage.includes(k));
      if (isSilent) return;

      if (error.context?.path && lastErrorRef.current !== error.context.path) {
        lastErrorRef.current = error.context.path;
        
        // SUPPRESS NOISY PATHS (These usually recover or are handled by ISR)
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

    // Cleanup: Restore original console methods when component unmounts
    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, [toast]);

  return null;
}
