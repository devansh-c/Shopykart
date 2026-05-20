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

    // Safety: Only run if document is ready or interactive
    if (document.readyState === 'loading') {
      const handleLoad = () => applyBranding(branding);
      window.addEventListener('DOMContentLoaded', handleLoad);
      return () => window.removeEventListener('DOMContentLoaded', handleLoad);
    } else {
      applyBranding(branding);
    }

    function applyBranding(data: any) {
      if (!data) return;

      // 1. Update Document Title
      if (data.siteTitle && document.title !== data.siteTitle) {
        document.title = data.siteTitle;
      }

      // 2. Helper to update/create Meta tags safely
      const updateMetaTag = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
        try {
          let element = document.querySelector(`meta[${attr}="${name}"]`);
          if (!element) {
            element = document.createElement('meta');
            element.setAttribute(attr, name);
            document.head.appendChild(element);
          }
          if (element.getAttribute('content') !== content) {
            element.setAttribute('content', content);
          }
        } catch (e) {
          console.warn(`Failed to update meta ${name}`);
        }
      };

      if (data.siteDescription) {
        updateMetaTag('description', data.siteDescription);
        updateMetaTag('og:description', data.siteDescription, 'property');
      }

      if (data.siteTitle) {
        updateMetaTag('og:title', data.siteTitle, 'property');
      }

      // 3. Helper to update/create Link tags (Favicons) safely
      const updateLinkTag = (rel: string, href: string) => {
        try {
          const elements = document.querySelectorAll(`link[rel*="${rel}"]`);
          if (elements.length > 0) {
            elements.forEach((el) => {
              const linkEl = el as HTMLLinkElement;
              if (linkEl.href !== href) linkEl.href = href;
            });
          } else {
            const newLink = document.createElement('link');
            newLink.rel = rel;
            newLink.href = href;
            document.head.appendChild(newLink);
          }
        } catch (e) {
          console.warn(`Failed to update link ${rel}`);
        }
      };

      const targetFavicon = data.faviconUrl || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛒</text></svg>';
      updateLinkTag('icon', targetFavicon);
      updateLinkTag('apple-touch-icon', targetFavicon);
    }

  }, [branding]);

  return null;
}
