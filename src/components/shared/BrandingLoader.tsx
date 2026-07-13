'use client';

import { useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * @fileOverview BrandingLoader dynamically updates SEO and Icons from Firestore.
 */
export default function BrandingLoader() {
  const firestore = useFirestore();

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);

  const { data: branding } = useDoc<any>(brandingRef);

  useEffect(() => {
    if (typeof window === 'undefined' || !branding) return;

    // 1. Update Site Title
    if (branding.siteTitle) {
      document.title = branding.siteTitle;
    }

    // 2. Update Meta Description
    if (branding.siteDescription) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', branding.siteDescription);
    }

    // 3. Update Favicon
    if (branding.faviconUrl) {
      const links = document.querySelectorAll("link[rel*='icon']");
      if (links.length > 0) {
        links.forEach(link => {
          (link as HTMLLinkElement).href = branding.faviconUrl;
        });
      } else {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = branding.faviconUrl;
        document.head.appendChild(link);
      }
    }
  }, [branding]);

  return null;
}
