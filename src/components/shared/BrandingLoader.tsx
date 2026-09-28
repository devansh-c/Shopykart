'use client';

import { useEffect, useRef } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * @fileOverview Optimized BrandingLoader.
 * Uses local state and refs to prevent hydration loops and rendering freezes.
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

    // Only update if actual data changed to prevent layout thrashing
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

      // Update meta description
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

      // Update icons only if valid data URI provided
      if (branding.logoUrl && branding.logoUrl.startsWith('data:')) {
        const icons = ['icon', 'shortcut icon', 'apple-touch-icon'];
        icons.forEach(rel => {
          let link = document.querySelector(`link[rel*='${rel}']`) as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = rel;
            document.head.appendChild(link);
          }
          if (link.href !== branding.logoUrl) {
            link.href = branding.logoUrl;
          }
        });
      }
    };

    // Use requestIdleCallback or setTimeout to run metadata updates outside critical render path
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(updateMetadata);
    } else {
      setTimeout(updateMetadata, 1000);
    }
  }, [branding]);

  return null;
}