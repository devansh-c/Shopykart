
'use client';

import { getMessaging, Messaging, isSupported } from 'firebase/messaging';
import { initializeFirebase } from './index';

let messagingInstance: Messaging | null = null;

export async function getFirebaseMessaging() {
  if (typeof window === 'undefined') return null;
  
  const supported = await isSupported();
  if (!supported) return null;

  if (!messagingInstance) {
    const { firebaseApp } = initializeFirebase();
    if (firebaseApp) {
      messagingInstance = getMessaging(firebaseApp);
    }
  }
  return messagingInstance;
}
