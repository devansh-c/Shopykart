'use client';

import { useEffect, useRef } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * @fileOverview De-blocked BrandingLoader.
 * Updates metadata only when idle to prevent startup freezes.
 */
export default function BrandingLoader() {
  const firestore = useFirestore();
  const lastUpdateRef = useRef<string>('');

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);

  const { data: branding } = useDoc<any>(brandingRef);

  useEffect(() => {
    if (typeof window === 'undefined' || !branding) return;

    const currentHash = JSON.stringify({
      title: branding.siteTitle,
      logo: branding.logoUrl
    });

    if (lastUpdateRef.current === currentHash) return;
    lastUpdateRef.current = currentHash;

    const updateMetadata = () => {
      if (branding.siteTitle && document.title !== branding.siteTitle) {
        document.title = branding.siteTitle;
      }

      if (branding.logoUrl && branding.logoUrl.startsWith('data:')) {
        const icon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
        if (icon && icon.href !== branding.logoUrl) {
          icon.href = branding.logoUrl;
        }
      }
    };

    // Use a small delay to let the app finish its first render
    const timer = setTimeout(updateMetadata, 2000);
    return () => clearTimeout(timer);
  }, [branding]);

  return null;
}
