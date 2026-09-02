'use client';

import { useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * @fileOverview BrandingLoader forced to use the new premium logo as default favicon.
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

    // DYNAMIC FAVICON UPDATE
    const faviconUrl = branding?.logoUrl || "/file_000000004d78821193714c20786ca8d1.png";
    const updateIcon = (rel: string) => {
      let link = document.querySelector(`link[rel*='${rel}']`) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
      }
      const cacheBuster = faviconUrl.includes('?') ? '&' : '?';
      link.href = `${faviconUrl}${cacheBuster}v=${Date.now()}`;
    };

    updateIcon('icon');
    updateIcon('shortcut icon');
    updateIcon('apple-touch-icon');
  }, [branding]);

  return null;
}
