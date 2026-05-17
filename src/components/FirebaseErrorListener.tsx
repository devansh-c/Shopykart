
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
      // Use console.warn instead of console.error to prevent Next.js Dev Red Screen Overlay
      console.warn('Firestore Permission Alert:', {
        path: error.context.path,
        operation: error.context.operation,
      });

      // Avoid showing the same toast multiple times for the same collection
      if (lastErrorRef.current !== error.context.path) {
        lastErrorRef.current = error.context.path;
        
        toast({
          variant: 'destructive',
          title: 'Database is Locked',
          description: `Please go to Firebase Console > Firestore > Rules and enable access to see your data.`,
        });

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
