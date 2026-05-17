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
      // Use console.warn instead of console.error to avoid Next.js Dev Red Screen Overlay
      console.warn('Firestore Permission Alert:', {
        path: error.context.path,
        operation: error.context.operation,
      });

      // Show toast notification if rules are not correctly set
      if (lastErrorRef.current !== error.context.path) {
        lastErrorRef.current = error.context.path;
        
        toast({
          variant: 'destructive',
          title: 'Database Access Restricted',
          description: `Cannot ${error.context.operation} at ${error.context.path}. Please verify your Firestore Security Rules.`,
        });

        // Reset the ref after 10 seconds to avoid spamming the same error
        setTimeout(() => {
          lastErrorRef.current = '';
        }, 10000);
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);
  }, [toast]);

  return null;
}
