'use client';

import { useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * @fileOverview BrandingLoader dynamically updates SEO and Favicon from Firestore.
 * Optimized with Cache-Busting for Favicons.
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

    // Default Metadata
    const defaultTitle = "Shopykart – 10 Min Veg Food Delivery|Mauranipur,Ranipur| Order Now";
    const defaultDesc = "Shopykart: Official 10-Min Veg Food Delivery! 🥗 Freshly Prepared | Best Prices | Open 10 AM - 8:15 PM. Verified Service by Shopykart";

    // 1. Update Site Title
    document.title = branding?.siteTitle || defaultTitle;

    // 2. Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', branding?.siteDescription || defaultDesc);

    // 3. FORCE UPDATE FAVICON (Aggressive Mode)
    if (branding?.faviconUrl) {
      const updateIcon = (rel: string) => {
        let link = document.querySelector(`link[rel*='${rel}']`) as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = rel;
          document.head.appendChild(link);
        }
        // Adding timestamp to bust browser cache
        const cacheBuster = branding.faviconUrl.includes('?') ? '&' : '?';
        link.href = `${branding.faviconUrl}${cacheBuster}v=${Date.now()}`;
      };

      updateIcon('icon');
      updateIcon('shortcut icon');
      updateIcon('apple-touch-icon');
    }
  }, [branding]);

  return null;
}
