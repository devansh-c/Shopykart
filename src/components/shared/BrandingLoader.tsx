'use client';

import { useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * @fileOverview BrandingLoader handles dynamic SEO updates from Firestore.
 * Refactored to prevent "removeChild" errors by updating existing nodes
 * instead of destructive removal/re-addition.
 */
export function BrandingLoader() {
  const firestore = useFirestore();

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);

  const { data: branding } = useDoc<any>(brandingRef);

  useEffect(() => {
    if (typeof window === 'undefined' || !document.head) return;

    // 1. Update Document Title
    if (branding?.siteTitle && document.title !== branding.siteTitle) {
      document.title = branding.siteTitle;
    }

    // 2. Helper to update/create Meta tags safely
    const updateMetaTag = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      let element = document.querySelector(`meta[${attr}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      if (element.getAttribute('content') !== content) {
        element.setAttribute('content', content);
      }
    };

    if (branding?.siteDescription) {
      updateMetaTag('description', branding.siteDescription);
      updateMetaTag('og:description', branding.siteDescription, 'property');
      updateMetaTag('twitter:description', branding.siteDescription);
    }

    if (branding?.siteTitle) {
      updateMetaTag('og:title', branding.siteTitle, 'property');
      updateMetaTag('twitter:title', branding.siteTitle);
    }

    // 3. Helper to update/create Link tags (Favicons) safely
    const updateLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel*="${rel}"]`) as HTMLLinkElement;
      
      // If we found an existing tag, just update its href
      if (element) {
        if (element.href !== href) {
          element.href = href;
        }
      } else {
        // Only create if it truly doesn't exist
        const newLink = document.createElement('link');
        newLink.rel = rel;
        newLink.href = href;
        document.head.appendChild(newLink);
      }
    };

    const targetFavicon = branding?.faviconUrl || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛒</text></svg>';

    updateLinkTag('icon', targetFavicon);
    updateLinkTag('apple-touch-icon', targetFavicon);
    updateLinkTag('shortcut icon', targetFavicon);

  }, [branding]);

  return null;
}
