
'use client';

import { useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * @fileOverview BrandingLoader for dynamic SEO and visual identity.
 * Optimized to prevent layout shifts and compilation loops in Next.js 15.
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

    const updateMetadata = () => {
      const defaultTitle = "Shopykart – Premium Delivery Hub";
      const defaultDesc = "Shopykart: Official 10-Min Veg Food Delivery! 🥗 Freshly Prepared | Best Prices.";

      if (document.title !== (branding.siteTitle || defaultTitle)) {
        document.title = branding.siteTitle || defaultTitle;
      }

      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      const newDesc = branding.siteDescription || defaultDesc;
      if (metaDesc.getAttribute('content') !== newDesc) {
        metaDesc.setAttribute('content', newDesc);
      }

      // CLEAN LOGO HANDLING: Only update if a valid data URL exists
      if (branding.logoUrl && branding.logoUrl.startsWith('data:')) {
        const updateIcon = (rel: string) => {
          let link = document.querySelector(`link[rel*='${rel}']`) as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = rel;
            document.head.appendChild(link);
          }
          if (link.href !== branding.logoUrl) {
            link.href = branding.logoUrl;
          }
        };

        updateIcon('icon');
        updateIcon('shortcut icon');
        updateIcon('apple-touch-icon');
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready and prevent loops
    requestAnimationFrame(updateMetadata);
  }, [branding]);

  return null;
}
