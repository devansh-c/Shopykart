'use client';

import { useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function BrandingLoader() {
  const firestore = useFirestore();

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);

  const { data: branding } = useDoc<any>(brandingRef);

  useEffect(() => {
    if (typeof window === 'undefined' || !branding) return;

    if (branding.siteTitle) {
      document.title = branding.siteTitle;
    }

    if (branding.faviconUrl) {
      const links = document.querySelectorAll("link[rel*='icon']");
      links.forEach(link => {
        (link as HTMLLinkElement).href = branding.faviconUrl;
      });
    }
  }, [branding]);

  return null;
}
