
'use client';

import { useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * @fileOverview BrandingLoader for dynamic SEO and visual identity.
 * Fixed: Removed broken image links causing 404 errors in logs.
 */
export default function BrandingLoader() {
  const firestore = useFirestore();

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);

  const { data: branding } = useDoc<any>(brandingRef);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const defaultTitle = "Shopykart – Premium Delivery Hub";
    const defaultDesc = "Shopykart: Official 10-Min Veg Food Delivery! 🥗 Freshly Prepared | Best Prices.";

    document.title = branding?.siteTitle || defaultTitle;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', branding?.siteDescription || defaultDesc);

    // CLEAN LOGO HANDLING: Only update if a valid data URL exists
    if (branding?.logoUrl && branding.logoUrl.startsWith('data:')) {
      const updateIcon = (rel: string) => {
        let link = document.querySelector(`link[rel*='${rel}']`) as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = rel;
          document.head.appendChild(link);
        }
        link.href = branding.logoUrl;
      };

      updateIcon('icon');
      updateIcon('shortcut icon');
      updateIcon('apple-touch-icon');
    }
  }, [branding]);

  return null;
}
