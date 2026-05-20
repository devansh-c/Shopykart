'use client';

import { useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * @fileOverview BrandingLoader handles dynamic SEO and UI branding from Firestore.
 * Refactored to be extremely defensive against DOM manipulation errors.
 */
export function BrandingLoader() {
  const firestore = useFirestore();

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);

  const { data: branding } = useDoc<any>(brandingRef);

  useEffect(() => {
    if (typeof window === 'undefined' || !document || !document.head) return;

    const applyBranding = (data: any) => {
      if (!data) return;

      // 1. Update Document Title
      if (data.siteTitle && document.title !== data.siteTitle) {
        document.title = data.siteTitle;
      }

      // 2. Helper to update Meta tags safely (Only update existing to avoid conflicts)
      const updateMetaTag = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
        try {
          const element = document.querySelector(`meta[${attr}="${name}"]`);
          if (element && element.getAttribute('content') !== content) {
            element.setAttribute('content', content);
          }
        } catch (e) {}
      };

      if (data.siteDescription) {
        updateMetaTag('description', data.siteDescription);
        updateMetaTag('og:description', data.siteDescription, 'property');
      }

      if (data.siteTitle) {
        updateMetaTag('og:title', data.siteTitle, 'property');
      }

      // 3. Helper to update Link tags (Favicons) safely
      const updateLinkTag = (rel: string, href: string) => {
        try {
          const elements = document.querySelectorAll(`link[rel*="${rel}"]`);
          if (elements.length > 0) {
            elements.forEach((el) => {
              const linkEl = el as HTMLLinkElement;
              if (linkEl.href !== href) linkEl.href = href;
            });
          }
        } catch (e) {}
      };

      if (data.faviconUrl) {
        updateLinkTag('icon', data.faviconUrl);
        updateLinkTag('apple-touch-icon', data.faviconUrl);
      }
    };

    // Safety: Only run if document is ready or interactive
    if (document.readyState === 'loading') {
      const handleLoad = () => applyBranding(branding);
      window.addEventListener('DOMContentLoaded', handleLoad);
      return () => window.removeEventListener('DOMContentLoaded', handleLoad);
    } else {
      applyBranding(branding);
    }

  }, [branding]);

  return null;
}
