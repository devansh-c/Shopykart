
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // Log the structured error for developer visibility
      console.error('Firestore Permission Error Detected:', {
        path: error.context.path,
        operation: error.context.operation,
        data: error.context.requestResourceData,
      });

      // Show a detailed toast to the user/developer
      toast({
        variant: 'destructive',
        title: 'Database Access Error',
        description: `Insufficient permissions for ${error.context.operation} at ${error.context.path}. Please check your Security Rules.`,
      });

      // In development mode, we throw it to trigger the Next.js error overlay
      if (process.env.NODE_ENV === 'development') {
        throw error;
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);
  }, [toast]);

  return null;
}
