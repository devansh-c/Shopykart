
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
      console.warn('Firestore Permission Denied:', {
        path: error.context.path,
        operation: error.context.operation,
      });

      // Show a toast to the user but don't crash the app
      toast({
        variant: 'destructive',
        title: 'Access Restricted',
        description: `You don't have permission to access ${error.context.path}. Please check your Firebase Security Rules.`,
      });
      
      // We removed the 'throw error' line here to prevent the Next.js Red Error Screen
    };

    errorEmitter.on('permission-error', handlePermissionError);
  }, [toast]);

  return null;
}
