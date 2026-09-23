
'use client';

import { useEffect, useRef } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * @fileOverview BrandingLoader for dynamic SEO and visual identity.
 * Optimized with useRef to prevent repetitive DOM updates that cause Next.js 15 refresh loops.
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
      desc: branding.siteDescription,
      logo: branding.logoUrl
    });

    if (lastUpdateRef.current === currentHash) return;
    lastUpdateRef.current = currentHash;

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

    requestAnimationFrame(updateMetadata);
  }, [branding]);

  return null;
}
