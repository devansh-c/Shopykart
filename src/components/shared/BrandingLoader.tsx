'use client';

import { useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * @fileOverview BrandingLoader handles dynamic branding from Firestore.
 * Refactored to safely update document properties without causing hydration mismatches
 * or head-fighting with Next.js metadata.
 */
export function BrandingLoader() {
  const firestore = useFirestore();

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);

  const { data: branding } = useDoc<any>(brandingRef);

  useEffect(() => {
    if (typeof window === 'undefined' || !branding) return;

    // 1. Update Title
    if (branding.siteTitle) {
      document.title = branding.siteTitle;
    }

    // 2. Update Theme Color Meta safely
    const updateMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    if (branding.siteDescription) {
      updateMeta('description', branding.siteDescription);
    }

    // 3. Update Favicon Link safely
    if (branding.faviconUrl) {
      const links = document.querySelectorAll("link[rel*='icon']");
      links.forEach(link => {
        (link as HTMLLinkElement).href = branding.faviconUrl;
      });
    }
  }, [branding]);

  return null;
}
